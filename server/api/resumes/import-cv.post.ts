import { extractText, getDocumentProxy } from 'unpdf'
import { parseResumeText } from '../../utils/resumeParser'
import { requireResumeUser } from '../../utils/resumeAuth'

const MAX_CV_SIZE = 10 * 1024 * 1024
const MAX_PAGES = 20

export default defineEventHandler(async (event) => {
  const { supabase, user } = await requireResumeUser(event)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('cv_file_path')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) throw createError({ statusCode: 500, statusMessage: 'Could not load your profile CV' })
  if (!profile?.cv_file_path) {
    return {
      status: 'cv-required' as const,
      warning: 'Upload a PDF CV to continue importing it into your resume.'
    }
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from('profile-documents')
    .download(profile.cv_file_path)

  if (downloadError || !file) {
    throw createError({ statusCode: 404, statusMessage: 'Your uploaded CV could not be opened' })
  }
  if (file.size > MAX_CV_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'CV must be 10 MB or smaller' })
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const pdf = await getDocumentProxy(bytes)
    if (pdf.numPages > MAX_PAGES) {
      throw createError({ statusCode: 413, statusMessage: `CV must be ${MAX_PAGES} pages or fewer` })
    }
    const result = await extractText(pdf, { mergePages: true })
    const text = result.text.trim()
    if (text.length < 40) {
      throw createError({ statusCode: 422, statusMessage: 'This PDF has no usable selectable text. Scanned PDFs are not supported yet.' })
    }

    return {
      status: 'ready' as const,
      ...parseResumeText(text, user.email || ''),
      sourceCvPath: profile.cv_file_path
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    const message = /password|encrypted/i.test(error?.message || '')
      ? 'Password-protected PDFs cannot be imported'
      : 'This PDF could not be read. Try another text-based PDF or start from your profile.'
    throw createError({ statusCode: 422, statusMessage: message })
  }
})
