import { createHash } from 'node:crypto'
import { z } from 'zod'
import { resumeDocumentSchema, resumeJobMatchAssessmentSchema } from '~~/shared/schemas/resume'
import { isResumeDocumentEmpty } from '~~/shared/utils/resume'
import { aiInputFingerprint, consumeAiCredit, releaseAiCredit, reserveAiCredit } from '../../../utils/billing'
import { requireResumeUser } from '../../../utils/resumeAuth'
import { RESUME_JOB_MATCH_SCORER_VERSION, scoreResumeForJob } from '../../../utils/resumeJobMatchScorer'

const requestSchema = z.object({ resumeId: z.uuid(), force: z.boolean().optional() }).strict()
const pending = new Map<string, Promise<unknown>>()

function plainText(value: unknown) {
  return String(value || '')
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function jobToText(job: Record<string, unknown>) {
  return [
    `ROLE\n${plainText(job.role || job.title)}`,
    `COMPANY\n${plainText(job.company_name)}`,
    `SUMMARY\n${plainText(job.short_description || job.description)}`,
    `JOB DESCRIPTION\n${plainText(job.job_description)}`,
    `EMPLOYMENT TYPE\n${plainText(job.employment_type)}`,
    `WORKPLACE\n${plainText(job.workplace)}`,
    `SKILLS OR TAGS\n${Array.isArray(job.tags) ? job.tags.map(plainText).join(', ') : plainText(job.tags)}`
  ].join('\n')
}

export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, 'id')
  if (!jobId) throw createError({ statusCode: 400, statusMessage: 'Missing job ID' })
  const request = requestSchema.safeParse(await readBody(event))
  if (!request.success) throw createError({ statusCode: 400, statusMessage: 'Invalid resume match request' })
  const { supabase, user } = await requireResumeUser(event)
  const resumeId = request.data.resumeId

  const [{ data: job, error: jobError }, { data: resume, error: resumeError }] = await Promise.all([
    supabase.schema('jobs').from('job_with_company_info').select('*').eq('id', jobId).maybeSingle(),
    supabase.from('resumes').select('content').eq('id', resumeId).eq('user_id', user.id).maybeSingle()
  ])
  if (jobError) throw createError({ statusCode: 500, statusMessage: 'Could not load the job' })
  if (!job) throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  if (resumeError) throw createError({ statusCode: 500, statusMessage: 'Could not load the resume' })
  if (!resume) throw createError({ statusCode: 404, statusMessage: 'Resume not found' })

  const parsedResume = resumeDocumentSchema.safeParse(resume.content)
  if (!parsedResume.success || isResumeDocumentEmpty(parsedResume.data)) {
    throw createError({ statusCode: 422, statusMessage: 'Add resume content before checking the match' })
  }

  const jobText = jobToText(job)
  const resumeHash = createHash('sha256').update(JSON.stringify(parsedResume.data)).digest('hex')
  const jobHash = createHash('sha256').update(jobText).digest('hex')
  const config = useRuntimeConfig(event)
  const model = String(config.geminiModel || 'gemini-3.8-flash').trim().toLowerCase().replace(/^models\//, '')
  const cacheKey = [user.id, jobId, resumeId, resumeHash, jobHash, RESUME_JOB_MATCH_SCORER_VERSION, model].join(':')

  const readCached = async () => {
    const { data: cached } = await supabase.from('resume_job_match_assessments')
      .select('assessment').eq('user_id', user.id).eq('job_id', jobId).eq('resume_id', resumeId)
      .eq('resume_hash', resumeHash).eq('job_hash', jobHash)
      .eq('scorer_version', RESUME_JOB_MATCH_SCORER_VERSION).eq('model', model).maybeSingle()
    return resumeJobMatchAssessmentSchema.safeParse(cached?.assessment)
  }

  if (!request.data.force) {
    const parsedCache = await readCached()
    if (parsedCache.success) return { ...parsedCache.data, cached: true }
  }
  if (pending.has(cacheKey)) {
    throw createError({ statusCode: 409, statusMessage: 'This resume match is already being calculated' })
  }

  const reservation = await reserveAiCredit({
    event,
    supabase,
    userId: user.id,
    feature: 'job_match',
    fingerprint: aiInputFingerprint(jobId, resumeId, resumeHash, jobHash, RESUME_JOB_MATCH_SCORER_VERSION, model, request.data.force === true)
  })
  if (reservation?.reused && reservation.status === 'consumed') {
    const cached = await readCached()
    if (cached.success) return { ...cached.data, cached: true }
    throw createError({ statusCode: 409, statusMessage: 'This resume match request was already completed' })
  }

  const assessmentPromise = scoreResumeForJob(parsedResume.data, jobText, {
    apiKey: config.GEMINI_API_KEY,
    model,
    userId: user.id
  }).finally(() => pending.delete(cacheKey))
  pending.set(cacheKey, assessmentPromise)

  try {
    const assessment = resumeJobMatchAssessmentSchema.parse(await assessmentPromise)
    const { error: saveError } = await supabase.from('resume_job_match_assessments').upsert({
      user_id: user.id,
      job_id: jobId,
      resume_id: resumeId,
      resume_hash: resumeHash,
      job_hash: jobHash,
      scorer_version: RESUME_JOB_MATCH_SCORER_VERSION,
      model,
      score: assessment.score,
      assessment,
      updated_at: new Date().toISOString()
    }, { onConflict: 'job_id,resume_id,resume_hash,job_hash,scorer_version,model' })
    if (saveError) throw new Error('Could not save resume match')
    await consumeAiCredit(supabase, user.id, reservation?.reservationId)
    return { ...assessment, cached: false }
  } catch {
    await releaseAiCredit(supabase, user.id, reservation?.reservationId, 'job_match_failed')
    throw createError({ statusCode: 503, statusMessage: 'Resume matching is temporarily unavailable. Please try again.' })
  }
})
