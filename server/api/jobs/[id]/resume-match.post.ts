import { createHash } from 'node:crypto'
import { z } from 'zod'
import { resumeDocumentSchema, resumeJobMatchAssessmentSchema } from '~~/shared/schemas/resume'
import { isResumeDocumentEmpty } from '~~/shared/utils/resume'
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

  const [{ data: resume, error: resumeError }, { data: job, error: jobError }] = await Promise.all([
    supabase.from('resumes').select('content').eq('id', request.data.resumeId).eq('user_id', user.id).maybeSingle(),
    supabase.schema('jobs').from('job_with_company_info').select('*').eq('id', jobId).maybeSingle()
  ])
  if (resumeError || jobError) throw createError({ statusCode: 500, statusMessage: 'Could not load the resume or job' })
  if (!resume) throw createError({ statusCode: 404, statusMessage: 'Resume not found' })
  if (!job) throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  const parsedResume = resumeDocumentSchema.safeParse(resume.content)
  if (!parsedResume.success || isResumeDocumentEmpty(parsedResume.data)) {
    throw createError({ statusCode: 422, statusMessage: 'Add resume content before checking the match' })
  }

  const jobText = jobToText(job)
  const resumeHash = createHash('sha256').update(JSON.stringify(parsedResume.data)).digest('hex')
  const jobHash = createHash('sha256').update(jobText).digest('hex')
  const config = useRuntimeConfig(event)
  const model = String(config.geminiModel || 'gemini-3.8-flash').trim().toLowerCase().replace(/^models\//, '')
  const cacheKey = [user.id, jobId, request.data.resumeId, resumeHash, jobHash, RESUME_JOB_MATCH_SCORER_VERSION, model].join(':')

  if (!request.data.force) {
    const { data: cached } = await supabase.from('resume_job_match_assessments')
      .select('assessment')
      .eq('user_id', user.id).eq('job_id', jobId).eq('resume_id', request.data.resumeId)
      .eq('resume_hash', resumeHash).eq('job_hash', jobHash)
      .eq('scorer_version', RESUME_JOB_MATCH_SCORER_VERSION).eq('model', model).maybeSingle()
    const parsedCache = resumeJobMatchAssessmentSchema.safeParse(cached?.assessment)
    if (parsedCache.success) return { ...parsedCache.data, cached: true }
  }

  let assessmentPromise = pending.get(cacheKey)
  if (!assessmentPromise) {
    assessmentPromise = scoreResumeForJob(parsedResume.data, jobText, {
      apiKey: config.GEMINI_API_KEY,
      model,
      userId: user.id
    }).finally(() => pending.delete(cacheKey))
    pending.set(cacheKey, assessmentPromise)
  }

  try {
    const assessment = resumeJobMatchAssessmentSchema.parse(await assessmentPromise)
    await supabase.from('resume_job_match_assessments').upsert({
      user_id: user.id,
      job_id: jobId,
      resume_id: request.data.resumeId,
      resume_hash: resumeHash,
      job_hash: jobHash,
      scorer_version: RESUME_JOB_MATCH_SCORER_VERSION,
      model,
      score: assessment.score,
      assessment,
      updated_at: new Date().toISOString()
    }, { onConflict: 'job_id,resume_id,resume_hash,job_hash,scorer_version,model' })
    return { ...assessment, cached: false }
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Resume matching is temporarily unavailable. Please try again.' })
  }
})
