import { createHash } from 'node:crypto'
import { z } from 'zod'
import { resumeAtsAssessmentSchema, resumeDocumentSchema } from '~~/shared/schemas/resume'
import { isResumeDocumentEmpty } from '~~/shared/utils/resume'
import {
  DEFAULT_RESUME_ATS_MODEL,
  RESUME_ATS_SCORER_VERSION,
  scoreResumeWithAi
} from '../../../utils/resumeAtsScorer'
import { requireResumeUser } from '../../../utils/resumeAuth'

const pendingAssessments = new Map<string, Promise<unknown>>()

function normalizedModel(model: string) {
  return model.trim().toLocaleLowerCase('en').replace(/^models\//, '')
}

export default defineEventHandler(async (event) => {
  const resumeId = getRouterParam(event, 'id')
  if (!resumeId) throw createError({ statusCode: 400, statusMessage: 'Missing resume ID' })

  const { supabase, user } = await requireResumeUser(event)
  const { data, error } = await supabase
    .from('resumes')
    .select('content')
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not load this resume' })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Resume not found' })

  const parsed = resumeDocumentSchema.safeParse(data.content)
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: 'This resume contains invalid data' })
  if (isResumeDocumentEmpty(parsed.data)) {
    throw createError({ statusCode: 422, statusMessage: 'Add some resume content before requesting an ATS score' })
  }
  const request = z.object({ force: z.boolean().optional() }).strict()
    .safeParse(await readBody(event).catch(() => ({})))
  if (!request.success) throw createError({ statusCode: 400, statusMessage: 'Invalid ATS score request' })
  const force = request.data.force === true

  const config = useRuntimeConfig(event)
  const model = normalizedModel(String(config.geminiModel || DEFAULT_RESUME_ATS_MODEL))
  const contentHash = createHash('sha256').update(JSON.stringify(parsed.data)).digest('hex')
  const cacheKey = [user.id, resumeId, contentHash, RESUME_ATS_SCORER_VERSION, model].join(':')

  if (!force) {
    const { data: cached } = await supabase
      .from('resume_ats_assessments')
      .select('assessment')
      .eq('user_id', user.id)
      .eq('resume_id', resumeId)
      .eq('content_hash', contentHash)
      .eq('scorer_version', RESUME_ATS_SCORER_VERSION)
      .eq('model', model)
      .maybeSingle()
    const cachedAssessment = resumeAtsAssessmentSchema.safeParse(cached?.assessment)
    if (cachedAssessment.success) return { ...cachedAssessment.data, cached: true, outdated: false }
  }

  let assessmentPromise = pendingAssessments.get(cacheKey)
  if (!assessmentPromise) {
    assessmentPromise = scoreResumeWithAi(parsed.data, {
      apiKey: config.GEMINI_API_KEY,
      model,
      userId: user.id
    }).finally(() => pendingAssessments.delete(cacheKey))
    pendingAssessments.set(cacheKey, assessmentPromise)
  }

  try {
    const assessment = resumeAtsAssessmentSchema.parse(await assessmentPromise)
    await supabase.from('resume_ats_assessments').upsert({
      user_id: user.id,
      resume_id: resumeId,
      content_hash: contentHash,
      scorer_version: RESUME_ATS_SCORER_VERSION,
      model,
      score: assessment.score,
      assessment,
      updated_at: new Date().toISOString()
    }, { onConflict: 'resume_id,content_hash,scorer_version,model' })
    return { ...assessment, cached: false, outdated: false }
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'ATS scoring is temporarily unavailable. Please try again.'
    })
  }
})
