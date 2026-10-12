import { extractText, getDocumentProxy } from 'unpdf'
import { parseResumeText } from '../../utils/resumeParser'
import { getBillingStatus, resumeBillingEnabled } from '../../utils/billing'
import { requireResumeBetaUser } from '../../utils/resumeAuth'
import { parseResumeWithCache } from '../../utils/resumeParseCache'

const MAX_CV_SIZE = 10 * 1024 * 1024
const MAX_PAGES = 20

export default defineEventHandler(async (event) => {
  const { supabase, user } = await requireResumeBetaUser(event)
  const billingStatus = await getBillingStatus(supabase, user.id, resumeBillingEnabled(event))
  if (!billingStatus.canCreateResume) {
    throw createError({ statusCode: 409, statusMessage: 'You have reached your resume limit', data: { code: 'RESUME_LIMIT_REACHED' } })
  }
  const contentType = getHeader(event, 'content-type') || ''
  let bytes: Uint8Array
  let basicMode = String(getQuery(event).mode || '') === 'basic'

  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    return {
      status: 'cv-required' as const,
      warning: 'Choose a PDF resume to import.'
    }
  }

  const parts = await readMultipartFormData(event)
  const uploadedFile = parts?.find(part => part.name === 'file')
  basicMode = basicMode || parts?.some(part => part.name === 'mode' && part.data.toString('utf8') === 'basic') === true
  if (!uploadedFile?.filename || !uploadedFile.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Choose a PDF CV to import' })
  }
  if (!uploadedFile.filename.toLowerCase().endsWith('.pdf')
    || (uploadedFile.type && uploadedFile.type !== 'application/pdf')) {
    throw createError({ statusCode: 415, statusMessage: 'CV must be a PDF file' })
  }
  if (uploadedFile.data.length > MAX_CV_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'CV must be 10 MB or smaller' })
  }
  bytes = new Uint8Array(uploadedFile.data)

  try {
    const pdf = await getDocumentProxy(bytes)
    if (pdf.numPages > MAX_PAGES) {
      throw createError({ statusCode: 413, statusMessage: `CV must be ${MAX_PAGES} pages or fewer` })
    }
    const result = await extractText(pdf, { mergePages: true })
    const text = result.text.trim()
    if (text.length < 40) {
      throw createError({ statusCode: 422, statusMessage: 'This PDF has no usable selectable text. Scanned PDFs are not supported yet.' })
    }

    const config = useRuntimeConfig()
    const parsed = basicMode
      ? (() => {
          const legacy = parseResumeText(text, user.email || '')
          return {
            ...legacy,
            warnings: ['Basic parsing was used. Review each section before saving.', ...legacy.warnings],
            parser: 'legacy' as const
          }
        })()
      : await parseResumeWithCache(text, {
          supabase,
          apiKey: config.GEMINI_API_KEY,
          model: config.geminiModel,
          userId: user.id,
          fallbackEmail: user.email || ''
        })

    return {
      status: 'ready' as const,
      document: parsed.document,
      warnings: parsed.warnings,
      sourceCvPath: null
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    const message = /password|encrypted/i.test(error?.message || '')
      ? 'Password-protected PDFs cannot be imported'
      : 'This PDF could not be read. Try another text-based PDF or start with a blank resume.'
    throw createError({ statusCode: 422, statusMessage: message })
  }
})
