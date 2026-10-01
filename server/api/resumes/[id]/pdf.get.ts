import { resumeDocumentSchema } from '~~/shared/schemas/resume'
import { sanitizeDownloadName } from '~~/shared/utils/resume'
import { renderResumePdf } from '../../../utils/resumePdf'
import { requireResumeUser } from '../../../utils/resumeAuth'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await requireResumeUser(event)
  const resumeId = getRouterParam(event, 'id')
  if (!resumeId) throw createError({ statusCode: 400, statusMessage: 'Missing resume ID' })

  const { data, error } = await supabase
    .from('resumes')
    .select('name, content')
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not load this resume' })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Resume not found' })

  const parsed = resumeDocumentSchema.safeParse(data.content)
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'This resume contains invalid data and cannot be exported' })
  }

  const pdf = await renderResumePdf(parsed.data)
  setResponseHeader(event, 'Content-Type', 'application/pdf')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${sanitizeDownloadName(data.name)}"`)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return pdf
})
