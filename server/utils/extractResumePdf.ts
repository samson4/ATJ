

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExtractedResumeLinkSource = 'pdf-annotation' | 'visible-text'

export interface ExtractedResumeLink {
  label: string
  url: string
  pageNumber: number
  source: ExtractedResumeLinkSource
}

export interface ExtractedResumePdf {
  text: string
  links: ExtractedResumeLink[]
}

// ---------------------------------------------------------------------------
// URL validation
// ---------------------------------------------------------------------------

const ALLOWED_SCHEMES = new Set(['https:', 'http:', 'mailto:'])

/**
 * Normalise and validate a URL extracted from a PDF annotation.
 * Returns the normalised URL string, or null if it is unsafe / invalid.
 * We never fetch or visit the URL during this step.
 */
export function sanitizeAnnotationUrl(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const parsed = new URL(trimmed)
    if (!ALLOWED_SCHEMES.has(parsed.protocol)) return null
    if (parsed.protocol !== 'mailto:' && !parsed.hostname) return null
    return parsed.href
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

const HOST_LABEL_MAP: Array<[RegExp, string]> = [
  [/\blinkedin\b/i, 'LinkedIn'],
  [/\bgithub\b/i, 'GitHub'],
  [/\bmedium\b/i, 'Medium'],
  [/\btwitter\b/i, 'Twitter'],
  [/\bx\.com\b/i, 'Twitter'],
  [/\binstagram\b/i, 'Instagram'],
  [/\bfacebook\b/i, 'Facebook'],
  [/\byoutube\b/i, 'YouTube'],
  [/\bdribbble\b/i, 'Dribbble'],
  [/\bbehance\b/i, 'Behance'],
  [/\bstackoverflow\b/i, 'Stack Overflow'],
  [/\bdev\.to\b/i, 'DEV'],
  [/\bhashnode\b/i, 'Hashnode'],
  [/\bsubstack\b/i, 'Substack'],
]

export function hostLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname
    for (const [pattern, label] of HOST_LABEL_MAP) {
      if (pattern.test(hostname)) return label
    }
    const parts = hostname.replace(/^www\./, '').split('.')
    const name = parts[0] || hostname
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return 'Link'
  }
}

// ---------------------------------------------------------------------------
// Rectangle overlap helpers
// PDF coordinate system: origin is bottom-left. Annotation rects and text
// item transforms are in the same device-space units per page.
// ---------------------------------------------------------------------------

interface Rect { x1: number; y1: number; x2: number; y2: number }

function rectsOverlap(a: Rect, b: Rect): boolean {
  const tolerance = 1
  return (
    a.x1 < b.x2 + tolerance &&
    a.x2 > b.x1 - tolerance &&
    a.y1 < b.y2 + tolerance &&
    a.y2 > b.y1 - tolerance
  )
}

function textItemRect(item: any): Rect {
  const [_a, _b, _c, _d, x, y] = item.transform as number[]
  const width: number = item.width ?? 0
  const height: number = item.height ?? 0
  return { x1: x, y1: y, x2: x + width, y2: y + height }
}

function annotationRect(raw: number[]): Rect {
  const [ax1, ay1, ax2, ay2] = raw
  return {
    x1: Math.min(ax1!, ax2!),
    y1: Math.min(ay1!, ay2!),
    x2: Math.max(ax1!, ax2!),
    y2: Math.max(ay1!, ay2!)
  }
}

// ---------------------------------------------------------------------------
// Per-page annotation link extraction
// ---------------------------------------------------------------------------

async function extractPageLinks(
  pdfProxy: any,
  pageNumber: number
): Promise<ExtractedResumeLink[]> {
  const page = await pdfProxy.getPage(pageNumber)

  const [annotations, textContent] = await Promise.all([
    page.getAnnotations({ intent: 'display' }) as Promise<any[]>,
    page.getTextContent() as Promise<any>
  ])

  const linkAnnotations = annotations.filter(
    (ann: any) =>
      ann.subtype === 'Link' &&
      typeof ann.url === 'string' &&
      ann.url.length > 0 &&
      Array.isArray(ann.rect) &&
      ann.rect.length === 4
  )

  if (linkAnnotations.length === 0) return []

  const textItems: any[] = (textContent.items || []).filter(
    (item: any) => typeof item.str === 'string' && item.str.trim().length > 0
  )

  const links: ExtractedResumeLink[] = []

  for (const ann of linkAnnotations) {
    const safeUrl = sanitizeAnnotationUrl(ann.url)
    if (!safeUrl) continue

    const annRect = annotationRect(ann.rect as number[])

    const overlapping = textItems.filter(item => rectsOverlap(annRect, textItemRect(item)))

    // Sort in reading order: higher y = earlier (PDF y increases upward),
    // break ties by x position
    overlapping.sort((a, b) => {
      const ay = a.transform[5] as number
      const by = b.transform[5] as number
      if (Math.abs(ay - by) > 2) return by - ay
      return (a.transform[4] as number) - (b.transform[4] as number)
    })

    const visibleText = overlapping.map((item: any) => item.str).join('').trim()

    let label = visibleText
    if (!label && ann.title && typeof ann.title === 'string') label = ann.title.trim()
    if (!label && ann.contents && typeof ann.contents === 'string') label = ann.contents.trim()
    if (!label) label = hostLabel(safeUrl)

    links.push({ label, url: safeUrl, pageNumber, source: 'pdf-annotation' })
  }

  return links
}

// ---------------------------------------------------------------------------
// Visible-text URL extraction (fallback for URLs printed in plain text)
// ---------------------------------------------------------------------------

const VISIBLE_URL_PATTERN = /(?:https?:\/\/|(?:www\.))[^\s<>"',)\]]+/gi

function stripTrailingPunctuation(url: string): string {
  return url.replace(/[.,;:!?)>\]]+$/, '')
}

export function extractVisibleTextLinks(text: string): ExtractedResumeLink[] {
  const seen = new Set<string>()
  const results: ExtractedResumeLink[] = []

  const raw = text.match(VISIBLE_URL_PATTERN) || []
  for (const match of raw) {
    const stripped = stripTrailingPunctuation(match)
    const withScheme = stripped.startsWith('www.') ? 'https://' + stripped : stripped
    const safeUrl = sanitizeAnnotationUrl(withScheme)
    if (!safeUrl || seen.has(safeUrl)) continue
    seen.add(safeUrl)
    results.push({ label: hostLabel(safeUrl), url: safeUrl, pageNumber: 0, source: 'visible-text' })
  }
  return results
}

// ---------------------------------------------------------------------------
// Link deduplication / merge
// ---------------------------------------------------------------------------

export function normalizeUrlForDedup(url: string): string {
  try {
    const u = new URL(url)
    return `${u.protocol}//${u.hostname}${u.port ? ':' + u.port : ''}${u.pathname.replace(/\/+$/, '')}${u.search}${u.hash}`.toLowerCase()
  } catch {
    return url.toLowerCase().replace(/\/+$/, '')
  }
}

/**
 * Merge annotation-derived links with visible-text links.
 * Annotation links take priority; visible-text links fill in only destinations
 * not already covered by an annotation. Deduplication is by normalised URL.
 */
export function mergeResumeLinks(
  annotationLinks: ExtractedResumeLink[],
  visibleTextLinks: ExtractedResumeLink[]
): ExtractedResumeLink[] {
  const seen = new Set<string>()
  const merged: ExtractedResumeLink[] = []

  for (const link of [...annotationLinks, ...visibleTextLinks]) {
    const key = normalizeUrlForDedup(link.url)
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(link)
    }
  }

  return merged.slice(0, 30)
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Extract page text (for the AI / basic parsers) and annotated hyperlinks
 * from a PDF. Links carry their visible label and a validated destination URL.
 * Unsafe schemes and internal PDF destinations are silently ignored.
 * A failure in link extraction is non-fatal; text is always returned.
 *
 * Accepts an already-opened PDFDocumentProxy so that the caller does not have
 * to open the same bytes twice. Opening a PDF with getDocumentProxy() transfers
 * the Uint8Array's underlying ArrayBuffer into the PDF.js worker, which detaches
 * the buffer and leaves the original Uint8Array empty. Passing the proxy avoids
 * that problem entirely.
 */
export async function extractResumePdf(pdfProxy: any): Promise<ExtractedResumePdf> {
  const pageTexts: string[] = []
  const allAnnotationLinks: ExtractedResumeLink[] = []

  for (let pageNum = 1; pageNum <= pdfProxy.numPages; pageNum++) {
    const page = await pdfProxy.getPage(pageNum)
    const textContent = await page.getTextContent()
    const pageText = (textContent.items as any[])
      .filter((item: any) => typeof item.str === 'string')
      .map((item: any) => item.str + (item.hasEOL ? '\n' : ''))
      .join('')
    pageTexts.push(pageText)

    try {
      const pageLinks = await extractPageLinks(pdfProxy, pageNum)
      allAnnotationLinks.push(...pageLinks)
    } catch {
      // Annotation failure on one page must not abort the whole import
    }
  }

  const rawText = pageTexts
    .join('\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  const visibleTextLinks = extractVisibleTextLinks(rawText)
  const links = mergeResumeLinks(allAnnotationLinks, visibleTextLinks)
  return { text: rawText, links }
}
