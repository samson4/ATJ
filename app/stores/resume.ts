import { defineStore } from 'pinia'
import { resumeAtsLatestResponseSchema, resumeAtsScoreResponseSchema, resumeDocumentSchema, resumeImportResponseSchema, resumeRowSchema } from '~~/shared/schemas/resume'
import type {
  CandidateProfile,
  ResumeCreationSource,
  ResumeDocument,
  ResumeRow,
  ResumeSaveStatus,
  ResumeTemplateKey
} from '~~/shared/types/resume'
import { createEmptyResumeDocument, createResumeFromProfile, sanitizeDownloadName } from '~~/shared/utils/resume'

const CV_BUCKET = 'profile-documents'
const CV_MIME_TYPE = 'application/pdf'
const MAX_CV_SIZE = 10 * 1024 * 1024

function sanitizeCvFileName(fileName: string) {
  return fileName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'cv.pdf'
}

function validateCvFile(file: File) {
  if ((file.type && file.type !== CV_MIME_TYPE) || !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('CV must be a PDF file.')
  }
  if (file.size > MAX_CV_SIZE) throw new Error('CV must be 10 MB or smaller.')
}

export const useResumeStore = defineStore('resume', () => {
  const resumes = ref<ResumeRow[]>([])
  const currentResume = ref<ResumeRow | null>(null)
  const loading = ref(false)
  const saveStatus = ref<ResumeSaveStatus>('idle')
  const errorMessage = ref('')
  const importWarnings = ref<string[]>([])
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let saveQueue: Promise<void> = Promise.resolve()

  function plainResumeContent(value: unknown) {
    return JSON.parse(JSON.stringify(value))
  }

  async function requireUser() {
    const { $supabase } = useNuxtApp()
    const { data: { user }, error } = await $supabase.auth.getUser()
    if (error || !user) throw new Error('You need to sign in again.')
    return user
  }

  async function accessToken() {
    const { $supabase } = useNuxtApp()
    const { data: { session } } = await $supabase.auth.getSession()
    if (!session?.access_token) throw new Error('You need to sign in again.')
    return session.access_token
  }

  async function fetchResumes() {
    loading.value = true
    errorMessage.value = ''
    try {
      const { $supabase } = useNuxtApp()
      const user = await requireUser()
      const { data, error } = await $supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      if (error) throw error
      resumes.value = (data || []).map(row => resumeRowSchema.parse(row))
    } catch (error: any) {
      errorMessage.value = error.message || 'Could not load your resumes.'
    } finally {
      loading.value = false
    }
  }

  async function fetchResume(id: string) {
    loading.value = true
    errorMessage.value = ''
    try {
      const { $supabase } = useNuxtApp()
      const user = await requireUser()
      const { data, error } = await $supabase
        .from('resumes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      if (!data) throw new Error('Resume not found.')
      currentResume.value = resumeRowSchema.parse(data)
      saveStatus.value = 'saved'
      return currentResume.value
    } catch (error: any) {
      errorMessage.value = error.message || 'Could not load this resume.'
      currentResume.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function prepareResumeSource(source: ResumeCreationSource) {
    const user = await requireUser()
    if (source === 'blank') {
      importWarnings.value = []
      return { status: 'ready' as const, document: createEmptyResumeDocument(), sourceCvPath: null }
    }

    const { $supabase } = useNuxtApp()
    if (source === 'profile') {
      importWarnings.value = []
      const { data, error } = await $supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (error) throw error
      return {
        status: 'ready' as const,
        document: createResumeFromProfile(data as CandidateProfile | null, user.email || ''),
        sourceCvPath: null
      }
    }

    importWarnings.value = []
    const token = await accessToken()
    const imported = resumeImportResponseSchema.parse(await $fetch('/api/resumes/import-cv', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }))
    if (imported.status === 'cv-required') return imported
    importWarnings.value = imported.warnings
    return { status: 'ready' as const, document: imported.document, sourceCvPath: imported.sourceCvPath }
  }

  async function uploadProfileCv(file: File) {
    validateCvFile(file)

    const { $supabase } = useNuxtApp()
    const user = await requireUser()
    const { data: profile, error: profileLookupError } = await $supabase
      .from('profiles')
      .select('cv_file_path, cv_file_name')
      .eq('id', user.id)
      .maybeSingle()
    if (profileLookupError) throw profileLookupError

    if (profile?.cv_file_path || profile?.cv_file_name) {
      return { path: profile.cv_file_path || null, uploaded: false as const }
    }

    const cvPath = `${user.id}/cv/${Date.now()}-${sanitizeCvFileName(file.name)}`
    const { error: uploadError } = await $supabase.storage
      .from(CV_BUCKET)
      .upload(cvPath, file, { contentType: CV_MIME_TYPE, upsert: false })
    if (uploadError) throw uploadError

    const { error: profileError } = await $supabase.from('profiles').upsert({
      id: user.id,
      cv_file_path: cvPath,
      cv_file_name: file.name,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })

    if (profileError) {
      await $supabase.storage.from(CV_BUCKET).remove([cvPath])
      throw profileError
    }

    return { path: cvPath, uploaded: true as const }
  }

  async function prepareResumeSourceFromFile(file: File, sourceCvPath: string | null = null) {
    validateCvFile(file)
    importWarnings.value = []
    const token = await accessToken()
    const body = new FormData()
    body.append('file', file, file.name)
    const imported = resumeImportResponseSchema.parse(await $fetch('/api/resumes/import-cv', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body
    }))
    if (imported.status === 'cv-required') throw new Error(imported.warning)
    importWarnings.value = imported.warnings
    return {
      status: 'ready' as const,
      document: imported.document,
      sourceCvPath
    }
  }

  async function createResume(
    name: string,
    source: ResumeCreationSource,
    templateKey: ResumeTemplateKey,
    prepared?: { document: ResumeDocument, sourceCvPath: string | null }
  ) {
    if (!prepared) importWarnings.value = []
    const { $supabase } = useNuxtApp()
    const user = await requireUser()
    const resolved = prepared
      ? { status: 'ready' as const, ...prepared }
      : await prepareResumeSource(source)
    if (resolved.status === 'cv-required') throw new Error(resolved.warning)
    const document = resumeDocumentSchema.parse(resolved.document)
    const { data, error } = await $supabase.from('resumes').insert({
      user_id: user.id,
      name: name.trim() || 'Untitled Resume',
      template_key: templateKey,
      schema_version: 1,
      content: document,
      source_cv_path: resolved.sourceCvPath
    }).select('*').single()
    if (error) throw error
    const resume = resumeRowSchema.parse(data)
    resumes.value.unshift(resume)
    return resume
  }

  async function duplicateResume(resume: ResumeRow) {
    const { $supabase } = useNuxtApp()
    const user = await requireUser()
    const { data, error } = await $supabase.from('resumes').insert({
      user_id: user.id,
      name: `${resume.name} copy`.slice(0, 120),
      template_key: resume.template_key,
      schema_version: resume.schema_version,
      content: resumeDocumentSchema.parse(plainResumeContent(resume.content)),
      source_cv_path: resume.source_cv_path
    }).select('*').single()
    if (error) throw error
    const copy = resumeRowSchema.parse(data)
    resumes.value.unshift(copy)
    return copy
  }

  async function renameResume(id: string, name: string) {
    const { $supabase } = useNuxtApp()
    const nextName = name.trim().slice(0, 120)
    if (!nextName) throw new Error('Resume name is required.')
    const { data, error } = await $supabase.from('resumes')
      .update({ name: nextName })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    const updated = resumeRowSchema.parse(data)
    const index = resumes.value.findIndex(item => item.id === id)
    if (index >= 0) resumes.value[index] = updated
    if (currentResume.value?.id === id) currentResume.value = updated
  }

  async function deleteResume(id: string) {
    const { $supabase } = useNuxtApp()
    const { error } = await $supabase.from('resumes').delete().eq('id', id)
    if (error) throw error
    resumes.value = resumes.value.filter(item => item.id !== id)
    if (currentResume.value?.id === id) currentResume.value = null
  }

  function scheduleSave() {
    if (!currentResume.value) return
    saveStatus.value = 'dirty'
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveTimer = null
      void flushSave().catch(() => undefined)
    }, 750)
  }

  async function flushSave() {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    if (!currentResume.value || saveStatus.value === 'saved') return saveQueue

    const id = currentResume.value.id
    const rawName = currentResume.value.name
    const rawTemplateKey = currentResume.value.template_key
    // Pinia exposes the document as a Vue Proxy. Convert it to plain JSON before
    // validation and transport because structuredClone cannot clone proxies.
    const rawContent = plainResumeContent(currentResume.value.content)
    const name = currentResume.value.name.trim().slice(0, 120) || 'Untitled Resume'
    const parsedContent = resumeDocumentSchema.safeParse(rawContent)
    if (!parsedContent.success) {
      saveStatus.value = 'error'
      errorMessage.value = parsedContent.error.issues[0]?.message || 'The resume contains invalid data.'
      throw new Error(errorMessage.value)
    }
    const content = parsedContent.data
    const snapshot = JSON.stringify({ name: rawName, template_key: rawTemplateKey, content: rawContent })
    saveStatus.value = 'saving'
    errorMessage.value = ''

    saveQueue = saveQueue.catch(() => undefined).then(async () => {
      const token = await accessToken()
      const data = await $fetch<{ updated_at: string }>(`/api/resumes/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: { name, template_key: rawTemplateKey, content }
      })
      if (currentResume.value?.id === id) {
        currentResume.value.updated_at = data.updated_at
        const latest = JSON.stringify({
          name: currentResume.value.name,
          template_key: currentResume.value.template_key,
          content: currentResume.value.content
        })
        saveStatus.value = latest === snapshot ? 'saved' : 'dirty'
        if (saveStatus.value === 'dirty' && !saveTimer) scheduleSave()
      }
    }).catch((error: any) => {
      saveStatus.value = 'error'
      errorMessage.value = error.data?.statusMessage || error.message || 'Autosave failed. Your changes are still in this browser.'
      throw error
    })
    return saveQueue
  }

  async function downloadResume(resume: ResumeRow) {
    if (currentResume.value?.id === resume.id) await flushSave()
    const token = await accessToken()
    const response = await fetch(`/api/resumes/${resume.id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.statusMessage || body?.message || 'Could not generate the PDF.')
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = sanitizeDownloadName(resume.name)
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  async function fetchLatestAtsScore(id: string) {
    const token = await accessToken()
    return resumeAtsLatestResponseSchema.parse(await $fetch(`/api/resumes/${id}/ats-score`, {
      headers: { Authorization: `Bearer ${token}` }
    })).result
  }

  async function assessResume(id: string, force = false) {
    const token = await accessToken()
    return resumeAtsScoreResponseSchema.parse(await $fetch(`/api/resumes/${id}/ats-score`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { force }
    }))
  }

  function clearCurrent() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = null
    currentResume.value = null
    saveStatus.value = 'idle'
    importWarnings.value = []
  }

  return {
    resumes,
    currentResume,
    loading,
    saveStatus,
    errorMessage,
    importWarnings,
    fetchResumes,
    fetchResume,
    prepareResumeSource,
    prepareResumeSourceFromFile,
    uploadProfileCv,
    createResume,
    duplicateResume,
    renameResume,
    deleteResume,
    scheduleSave,
    flushSave,
    fetchLatestAtsScore,
    assessResume,
    downloadResume,
    clearCurrent
  }
})
