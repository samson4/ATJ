import { describe, expect, it } from 'vitest'
import {
  sanitizeAnnotationUrl,
  hostLabel,
  extractVisibleTextLinks,
  mergeResumeLinks,
  normalizeUrlForDedup,
  type ExtractedResumeLink
} from '../server/utils/extractResumePdf'
import { createResumeParseInputHash } from '../server/utils/resumeParseCache'

// ---------------------------------------------------------------------------
// sanitizeAnnotationUrl
// ---------------------------------------------------------------------------
describe('sanitizeAnnotationUrl', () => {
  it('accepts https, http, and mailto schemes', () => {
    expect(sanitizeAnnotationUrl('https://linkedin.com/in/marta')).toBe('https://linkedin.com/in/marta')
    expect(sanitizeAnnotationUrl('http://example.com')).toBe('http://example.com/')
    expect(sanitizeAnnotationUrl('mailto:hello@example.com')).toBe('mailto:hello@example.com')
  })

  it('rejects unsafe schemes', () => {
    expect(sanitizeAnnotationUrl('javascript:alert(1)')).toBeNull()
    expect(sanitizeAnnotationUrl('data:text/html,<h1>xss</h1>')).toBeNull()
    expect(sanitizeAnnotationUrl('file:///etc/passwd')).toBeNull()
    expect(sanitizeAnnotationUrl('ftp://example.com')).toBeNull()
    expect(sanitizeAnnotationUrl('vbscript:msgbox(1)')).toBeNull()
  })

  it('rejects blank and non-string input', () => {
    expect(sanitizeAnnotationUrl('')).toBeNull()
    expect(sanitizeAnnotationUrl('   ')).toBeNull()
    expect(sanitizeAnnotationUrl(null as any)).toBeNull()
  })

  it('rejects http/https URLs without a hostname', () => {
    expect(sanitizeAnnotationUrl('https://')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// hostLabel
// ---------------------------------------------------------------------------
describe('hostLabel', () => {
  it('returns known service labels', () => {
    expect(hostLabel('https://www.linkedin.com/in/marta')).toBe('LinkedIn')
    expect(hostLabel('https://github.com/marta')).toBe('GitHub')
    expect(hostLabel('https://medium.com/@marta')).toBe('Medium')
    expect(hostLabel('https://twitter.com/marta')).toBe('Twitter')
    expect(hostLabel('https://x.com/marta')).toBe('Twitter')
    expect(hostLabel('https://dribbble.com/marta')).toBe('Dribbble')
    expect(hostLabel('https://stackoverflow.com/users/123')).toBe('Stack Overflow')
  })

  it('returns capitalised subdomain for unknown hosts', () => {
    expect(hostLabel('https://marta.dev')).toBe('Marta')
    expect(hostLabel('https://example.com')).toBe('Example')
  })

  it('returns Link for invalid URLs', () => {
    expect(hostLabel('not-a-url')).toBe('Link')
  })
})

// ---------------------------------------------------------------------------
// extractVisibleTextLinks
// ---------------------------------------------------------------------------
describe('extractVisibleTextLinks', () => {
  it('extracts https:// links and normalises www. prefix forms', () => {
    const links = extractVisibleTextLinks(
      'Contact: https://linkedin.com/in/marta | www.github.com/marta'
    )
    expect(links).toHaveLength(2)
    expect(links[0]?.url).toBe('https://linkedin.com/in/marta')
    expect(links[0]?.label).toBe('LinkedIn')
    expect(links[1]?.url).toBe('https://www.github.com/marta')
    expect(links[1]?.label).toBe('GitHub')
  })

  it('strips trailing punctuation from extracted URLs', () => {
    const links = extractVisibleTextLinks('See https://example.com/blog. And https://example.org/page,')
    const urls = links.map(l => l.url)
    expect(urls).toContain('https://example.com/blog')
    expect(urls).toContain('https://example.org/page')
    // Should not contain trailing dot/comma
    expect(urls.some(u => u.endsWith('.'))).toBe(false)
    expect(urls.some(u => u.endsWith(','))).toBe(false)
  })

  it('deduplicates identical visible-text URLs', () => {
    const text = 'https://github.com/marta https://github.com/marta'
    const links = extractVisibleTextLinks(text)
    expect(links).toHaveLength(1)
  })

  it('returns empty array when no URLs are present', () => {
    expect(extractVisibleTextLinks('No URLs here.')).toHaveLength(0)
  })

  it('labels medium.com correctly', () => {
    const links = extractVisibleTextLinks('https://medium.com/@marta')
    expect(links[0]?.label).toBe('Medium')
  })

  it('rejects javascript: URLs embedded in text', () => {
    // javascript: doesn't match the URL pattern (requires https?:// or www.)
    const links = extractVisibleTextLinks('javascript:alert(1)')
    expect(links).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// normalizeUrlForDedup
// ---------------------------------------------------------------------------
describe('normalizeUrlForDedup', () => {
  it('treats trailing-slash and no-trailing-slash as identical', () => {
    expect(normalizeUrlForDedup('https://github.com/marta'))
      .toBe(normalizeUrlForDedup('https://github.com/marta/'))
  })

  it('is case-insensitive on scheme and host', () => {
    expect(normalizeUrlForDedup('HTTPS://GitHub.COM/marta'))
      .toBe(normalizeUrlForDedup('https://github.com/marta'))
  })
})

// ---------------------------------------------------------------------------
// mergeResumeLinks
// ---------------------------------------------------------------------------

function ann(label: string, url: string, pageNumber = 1): ExtractedResumeLink {
  return { label, url, pageNumber, source: 'pdf-annotation' }
}
function vis(label: string, url: string): ExtractedResumeLink {
  return { label, url, pageNumber: 0, source: 'visible-text' }
}

describe('mergeResumeLinks', () => {
  it('annotation links take priority over visible-text links for the same URL', () => {
    const annotations = [ann('LinkedIn', 'https://linkedin.com/in/marta')]
    const visible = [vis('Portfolio', 'https://linkedin.com/in/marta')]
    const merged = mergeResumeLinks(annotations, visible)
    expect(merged).toHaveLength(1)
    expect(merged[0]?.source).toBe('pdf-annotation')
    expect(merged[0]?.label).toBe('LinkedIn')
  })

  it('visible-text links supplement annotation links for different URLs', () => {
    const annotations = [ann('LinkedIn', 'https://linkedin.com/in/marta')]
    const visible = [vis('GitHub', 'https://github.com/marta')]
    const merged = mergeResumeLinks(annotations, visible)
    expect(merged).toHaveLength(2)
    expect(merged.map(l => l.source)).toEqual(['pdf-annotation', 'visible-text'])
  })

  it('deduplicates by normalised URL (trailing slash, case)', () => {
    const annotations = [ann('Medium', 'https://medium.com/@marta/')]
    const visible = [vis('Medium', 'https://medium.com/@marta')]
    expect(mergeResumeLinks(annotations, visible)).toHaveLength(1)
  })

  it('caps result at 30 links', () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      ann(`Ann ${i}`, `https://example.com/ann/${i}`)
    )
    const vis20 = Array.from({ length: 20 }, (_, i) =>
      vis(`Vis ${i}`, `https://example.com/vis/${i}`)
    )
    expect(mergeResumeLinks(many, vis20)).toHaveLength(30)
  })

  it('returns empty array when both inputs are empty', () => {
    expect(mergeResumeLinks([], [])).toHaveLength(0)
  })

  it('preserves label "Medium" and does not replace it with "Portfolio"', () => {
    const annotations = [
      ann('Medium', 'https://medium.com/@marta'),
      ann('Portfolio', 'https://portfolio.marta.dev'),
    ]
    const merged = mergeResumeLinks(annotations, [])
    const mediumLink = merged.find(l => l.url.includes('medium.com'))
    expect(mediumLink?.label).toBe('Medium')
  })

  it('several inline links on one line each map to their correct label and URL', () => {
    const annotations = [
      ann('LinkedIn', 'https://linkedin.com/in/marta'),
      ann('GitHub', 'https://github.com/marta'),
      ann('Medium', 'https://medium.com/@marta'),
      ann('Portfolio', 'https://marta.dev'),
    ]
    const merged = mergeResumeLinks(annotations, [])
    expect(merged).toHaveLength(4)
    expect(merged.map(l => l.label)).toEqual(['LinkedIn', 'GitHub', 'Medium', 'Portfolio'])
    expect(merged.map(l => l.url)).toEqual([
      'https://linkedin.com/in/marta',
      'https://github.com/marta',
      'https://medium.com/@marta',
      'https://marta.dev',
    ])
  })
})

// ---------------------------------------------------------------------------
// Cache key isolation for annotation links
// ---------------------------------------------------------------------------
describe('createResumeParseInputHash with annotation fingerprint', () => {
  it('produces different hashes for same text but different embedded annotation URLs', () => {
    const text = 'Marta Tesfaye\nSoftware Engineer'
    const email = 'marta@example.com'
    const fingerprint1 = 'https://linkedin.com/in/marta\nhttps://github.com/marta'
    const fingerprint2 = 'https://linkedin.com/in/marta\nhttps://medium.com/@marta'

    const hash1 = createResumeParseInputHash(text, email, fingerprint1)
    const hash2 = createResumeParseInputHash(text, email, fingerprint2)
    const hashNoFingerprint = createResumeParseInputHash(text, email)

    expect(hash1).not.toBe(hash2)
    expect(hash1).not.toBe(hashNoFingerprint)
    expect(hash2).not.toBe(hashNoFingerprint)
  })

  it('produces the same hash when the annotation fingerprint is empty', () => {
    const text = 'Marta Tesfaye'
    expect(createResumeParseInputHash(text, '', ''))
      .toBe(createResumeParseInputHash(text, ''))
  })
})
