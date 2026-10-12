import { createHash } from 'node:crypto'
import { resumeAtsAssessmentSchema, resumeDocumentSchema } from '~~/shared/schemas/resume'
import { RESUME_ATS_SCORER_VERSION } from '../../../utils/resumeAtsScorer'
import { requireResumeUser } from '../../../utils/resumeAuth'

export default defineEventHandler(async (event) => {
  const resumeId = getRouterParam(event, 'id')
  if (!resumeId) throw createError({ statusCode: 400, statusMessage: 'Missing resume ID' })

  const { supabase, user } = await requireResumeUser(event)
  const { data: resume, error: resumeError } = await supabase
    .from('resumes')
    .select('content')
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (resumeError) throw createError({ statusCode: 500, statusMessage: 'Could not load this resume' })
  if (!resume) throw createError({ statusCode: 404, statusMessage: 'Resume not found' })

  const parsedResume = resumeDocumentSchema.safeParse(resume.content)
  if (!parsedResume.success) throw createError({ statusCode: 422, statusMessage: 'This resume contains invalid data' })
  const contentHash = createHash('sha256').update(JSON.stringify(parsedResume.data)).digest('hex')

  const { data: latest, error: latestError } = await supabase
    .from('resume_ats_assessments')
    .select('assessment, content_hash')
    .eq('user_id', user.id)
    .eq('resume_id', resumeId)
    .eq('scorer_version', RESUME_ATS_SCORER_VERSION)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (latestError) throw createError({ statusCode: 500, statusMessage: 'Could not load the latest ATS score' })
  if (!latest) return { result: null }

  const assessment = resumeAtsAssessmentSchema.safeParse(latest.assessment)
  if (!assessment.success) return { result: null }
  return {
    result: {
      ...assessment.data,
      cached: true,
      outdated: latest.content_hash !== contentHash
    }
  }
})
