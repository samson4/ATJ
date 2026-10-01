import { defineStore } from 'pinia'
import { resumeDocumentSchema, resumeImportResponseSchema, resumeRowSchema } from '~~/shared/schemas/resume'
import type {
  CandidateProfile,
  ResumeCreationSource,
  ResumeRow,
  ResumeSaveStatus
} from '~~/shared/types/resume'
import { createEmptyResumeDocument, createResumeFromProfile, sanitizeDownloadName } from '~~/shared/utils/resume'

export const useResumeStore = defineStore('resume', () => {
  const resumes = ref<ResumeRow[]>([])
  const currentResume = ref<ResumeRow | null>(null)
  const loading = ref(false)
  const saveStatus = ref<ResumeSaveStatus>('idle')
  const errorMessage = ref('')
  const importWarnings = ref<string[]>([])
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let saveQueue: Promise<void> = Promise.resolve()

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

  async function sourceDocument(source: ResumeCreationSource) {
    const user = await requireUser()
    if (source === 'blank') return { document: createEmptyResumeDocument(), sourceCvPath: null }

    const { $supabase } = useNuxtApp()
    if (source === 'profile') {
      const { data, error } = await $supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (error) throw error
      return {
        document: createResumeFromProfile(data as CandidateProfile | null, user.email || ''),
        sourceCvPath: null
      }
    }

    const token = await accessToken()
    const imported = resumeImportResponseSchema.parse(await $fetch('/api/resumes/import-cv', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }))
    importWarnings.value = imported.warnings
    return { document: imported.document, sourceCvPath: imported.sourceCvPath }
  }

  async function createResume(name: string, source: ResumeCreationSource) {
    importWarnings.value = []
    const { $supabase } = useNuxtApp()
    const user = await requireUser()
    const resolved = await sourceDocument(source)
    const document = resumeDocumentSchema.parse(resolved.document)
    const { data, error } = await $supabase.from('resumes').insert({
      user_id: user.id,
      name: name.trim() || 'Untitled Resume',
      template_key: 'ats-classic',
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
      content: resumeDocumentSchema.parse(structuredClone(resume.content)),
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
    const name = currentResume.value.name.trim().slice(0, 120) || 'Untitled Resume'
    const content = resumeDocumentSchema.parse(structuredClone(currentResume.value.content))
    const snapshot = JSON.stringify({ name, content })
    saveStatus.value = 'saving'
    errorMessage.value = ''

    saveQueue = saveQueue.catch(() => undefined).then(async () => {
      const { $supabase } = useNuxtApp()
      const { data, error } = await $supabase.from('resumes')
        .update({ name, content })
        .eq('id', id)
        .select('updated_at')
        .single()
      if (error) throw error
      if (currentResume.value?.id === id) {
        currentResume.value.updated_at = data.updated_at
        const latest = JSON.stringify({
          name: currentResume.value.name.trim().slice(0, 120) || 'Untitled Resume',
          content: currentResume.value.content
        })
        saveStatus.value = latest === snapshot ? 'saved' : 'dirty'
        if (saveStatus.value === 'dirty' && !saveTimer) scheduleSave()
      }
    }).catch((error: any) => {
      saveStatus.value = 'error'
      errorMessage.value = error.message || 'Autosave failed. Your changes are still in this browser.'
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
    createResume,
    duplicateResume,
    renameResume,
    deleteResume,
    scheduleSave,
    flushSave,
    downloadResume,
    clearCurrent
  }
})
