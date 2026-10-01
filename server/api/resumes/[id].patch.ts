import { resumeSaveRequestSchema } from '~~/shared/schemas/resume'
import { requireResumeUser } from '../../utils/resumeAuth'

export default defineEventHandler(async (event) => {
  const resumeId = getRouterParam(event, 'id')
  if (!resumeId) throw createError({ statusCode: 400, statusMessage: 'Missing resume ID' })

  const { supabase, user } = await requireResumeUser(event)
  const parsed = resumeSaveRequestSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'The resume contains invalid data and could not be saved' })
  }

  const { data, error } = await supabase
    .from('resumes')
    .update(parsed.data)
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .select('updated_at')
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not save the resume' })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Resume not found' })
  return data
})
