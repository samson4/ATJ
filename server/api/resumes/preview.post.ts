import { resumeDocumentSchema } from '~~/shared/schemas/resume'
import { requireResumeUser } from '../../utils/resumeAuth'
import { renderResumePdf } from '../../utils/resumePdf'

export default defineEventHandler(async (event) => {
  await requireResumeUser(event)
  const parsed = resumeDocumentSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'The resume contains invalid data and cannot be previewed' })
  }

  const pdf = await renderResumePdf(parsed.data)
  setResponseHeader(event, 'Content-Type', 'application/pdf')
  setResponseHeader(event, 'Content-Disposition', 'inline; filename="resume-preview.pdf"')
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return pdf
})
