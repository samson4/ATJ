import { resumeCreateRequestSchema, resumeRowSchema } from '~~/shared/schemas/resume'
import { requireResumeBetaUser } from '../../utils/resumeAuth'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await requireResumeBetaUser(event)
  const request = resumeCreateRequestSchema.safeParse(await readBody(event))
  if (!request.success) throw createError({ statusCode: 422, statusMessage: 'Invalid resume data' })
  if (request.data.source_cv_path && !request.data.source_cv_path.startsWith(`${user.id}/`)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid source CV path' })
  }
  const { data, error } = await supabase.rpc('create_limited_resume', {
    p_user_id: user.id,
    p_name: request.data.name,
    p_template_key: request.data.template_key,
    p_schema_version: 1,
    p_content: request.data.content,
    p_source_cv_path: request.data.source_cv_path
  })
  if (error) {
    if (`${error.message || ''} ${error.details || ''}`.includes('resume_limit_reached')) {
      throw createError({ statusCode: 409, statusMessage: 'You have reached your resume limit', data: { code: 'RESUME_LIMIT_REACHED' } })
    }
    throw createError({ statusCode: 500, statusMessage: 'Could not create resume' })
  }
  return resumeRowSchema.parse(data)
})
