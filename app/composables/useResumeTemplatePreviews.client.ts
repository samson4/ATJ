import type { ResumeDocument, ResumeTemplateKey } from '~~/shared/types/resume'
import { resumeTemplates } from '~~/shared/data/resumeTemplates'

type PreviewStatus = 'idle' | 'loading' | 'ready' | 'error'

export type ResumeTemplatePreview = {
  status: PreviewStatus
  imageUrl: string
  pageCount: number
  error: string
}

type CachedPreview = Pick<ResumeTemplatePreview, 'imageUrl' | 'pageCount'>

const previewCache = new Map<string, Partial<Record<ResumeTemplateKey, CachedPreview>>>()
const MAX_CACHE_ENTRIES = 3

function emptyPreview(): ResumeTemplatePreview {
  return { status: 'idle', imageUrl: '', pageCount: 0, error: '' }
}

function documentCacheKey(document: ResumeDocument) {
  return JSON.stringify(document)
}

function rememberPreview(cacheKey: string, templateKey: ResumeTemplateKey, preview: CachedPreview) {
  const cached = previewCache.get(cacheKey) || {}
  cached[templateKey] = preview
  previewCache.delete(cacheKey)
  previewCache.set(cacheKey, cached)

  while (previewCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = previewCache.keys().next().value
    if (typeof oldestKey !== 'string') break
    previewCache.delete(oldestKey)
  }
}

export function useResumeTemplatePreviews(document: Ref<ResumeDocument | undefined>, selectedKey: Ref<ResumeTemplateKey>) {
  const previews = reactive<Record<ResumeTemplateKey, ResumeTemplatePreview>>(
    Object.fromEntries(resumeTemplates.map(template => [template.key, emptyPreview()])) as Record<ResumeTemplateKey, ResumeTemplatePreview>
  )
  let controllers: AbortController[] = []
  let generation = 0

  function cancel() {
    generation += 1
    controllers.forEach(controller => controller.abort())
    controllers = []
  }

  async function renderFirstPage(blob: Blob) {
    const [{ getDocument, GlobalWorkerOptions }, workerModule] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    ])
    GlobalWorkerOptions.workerSrc = workerModule.default

    const task = getDocument({ data: new Uint8Array(await blob.arrayBuffer()) })
    const pdf = await task.promise
    try {
      const page = await pdf.getPage(1)
      const initialViewport = page.getViewport({ scale: 1 })
      const targetWidth = 480
      const viewport = page.getViewport({ scale: targetWidth / initialViewport.width })
      const canvas = window.document.createElement('canvas')
      const context = canvas.getContext('2d', { alpha: false })
      if (!context) throw new Error('Your browser could not draw this preview.')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvas, canvasContext: context, viewport }).promise
      return {
        imageUrl: canvas.toDataURL('image/webp', 0.86),
        pageCount: pdf.numPages
      }
    } finally {
      await pdf.destroy()
    }
  }

  async function generateOne(
    resumeDocument: ResumeDocument,
    cacheKey: string,
    templateKey: ResumeTemplateKey,
    token: string,
    activeGeneration: number
  ) {
    const preview = previews[templateKey]
    preview.status = 'loading'
    preview.error = ''
    const controller = new AbortController()
    controllers.push(controller)

    try {
      const response = await fetch('/api/resumes/preview', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ document: resumeDocument, templateKey }),
        signal: controller.signal
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.statusMessage || body?.message || 'Could not generate this preview.')
      }

      const rendered = await renderFirstPage(await response.blob())
      if (activeGeneration !== generation) return
      Object.assign(preview, { ...rendered, status: 'ready', error: '' })
      rememberPreview(cacheKey, templateKey, rendered)
    } catch (error: any) {
      if (activeGeneration !== generation || error?.name === 'AbortError') return
      preview.status = 'error'
      preview.error = error?.message || 'Could not generate this preview.'
    } finally {
      controllers = controllers.filter(item => item !== controller)
    }
  }

  async function generate(forceTemplateKey?: ResumeTemplateKey) {
    const resumeDocument = document.value
    if (!resumeDocument) return
    cancel()
    const activeGeneration = generation
    const cacheKey = documentCacheKey(resumeDocument)
    const cached = previewCache.get(cacheKey) || {}

    for (const template of resumeTemplates) {
      const cachedPreview = cached[template.key]
      if (cachedPreview && template.key !== forceTemplateKey) {
        Object.assign(previews[template.key], { ...cachedPreview, status: 'ready', error: '' })
      } else {
        Object.assign(previews[template.key], emptyPreview())
      }
    }

    const queue = [selectedKey.value, ...resumeTemplates.map(template => template.key)]
      .filter((key, index, keys) => keys.indexOf(key) === index)
      .filter(key => previews[key].status !== 'ready')
    if (!queue.length) return

    const { $supabase } = useNuxtApp()
    const { data: { session } } = await $supabase.auth.getSession()
    if (!session?.access_token) {
      queue.forEach((key) => {
        previews[key].status = 'error'
        previews[key].error = 'You need to sign in again.'
      })
      return
    }

    const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
      while (activeGeneration === generation) {
        const key = queue.shift()
        if (!key) return
        await generateOne(resumeDocument, cacheKey, key, session.access_token, activeGeneration)
      }
    })
    await Promise.all(workers)
  }

  function retry(templateKey: ResumeTemplateKey) {
    return generate(templateKey)
  }

  onBeforeUnmount(cancel)

  return { previews, generate, retry, cancel }
}
