import type {
  CandidateProfile,
  ResumeDocument,
  ResumeEducation,
  ResumeExperience,
  ResumeSectionKey
} from '../types/resume'

export const defaultResumeSectionOrder: ResumeSectionKey[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'links'
]

export function createResumeItemId() {
  return globalThis.crypto?.randomUUID?.() || `item-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function createEmptyResumeDocument(): ResumeDocument {
  return {
    basics: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      headline: '',
      summary: ''
    },
    experience: [],
    education: [],
    skillGroups: [],
    projects: [],
    certifications: [],
    languages: [],
    links: [],
    sectionOrder: [...defaultResumeSectionOrder]
  }
}

export function isResumeDocumentEmpty(document: ResumeDocument) {
  const basicsAreEmpty = [
    document.basics.fullName,
    document.basics.email,
    document.basics.phone,
    document.basics.location,
    document.basics.headline
  ].every(item => !item.trim()) && !richTextToPlainText(document.basics.summary)
  return basicsAreEmpty
    && document.experience.length === 0
    && document.education.length === 0
    && document.skillGroups.length === 0
    && document.projects.length === 0
    && document.certifications.length === 0
    && document.languages.length === 0
    && document.links.length === 0
}

export function createResumeTemplatePreviewDocument(): ResumeDocument {
  const document = createEmptyResumeDocument()
  document.basics = {
    fullName: '[YOUR NAME]',
    email: '[EMAIL]',
    phone: '[PHONE]',
    location: '[LOCATION]',
    headline: '[PROFESSIONAL TITLE]',
    summary: '<p>[Write a short summary highlighting your experience, strengths, and career goals.]</p>'
  }
  document.skillGroups = [
    { id: 'sample-skills-1', name: '[TECHNICAL SKILLS]', items: ['Skill one', 'Skill two', 'Skill three'] },
    { id: 'sample-skills-2', name: '[TOOLS]', items: ['Tool one', 'Tool two', 'Tool three'] }
  ]
  document.experience = [
    {
      id: 'sample-experience-1',
      title: '[JOB TITLE]',
      company: '[COMPANY NAME]',
      location: '[LOCATION]',
      startDate: '[START DATE]',
      endDate: '',
      current: true,
      bullets: '<ul><li>[Describe an achievement and its measurable impact.]</li><li>[Highlight a relevant responsibility or project.]</li></ul>'
    },
    {
      id: 'sample-experience-2',
      title: '[PREVIOUS JOB TITLE]',
      company: '[COMPANY NAME]',
      location: '[LOCATION]',
      startDate: '[START DATE]',
      endDate: '[END DATE]',
      current: false,
      bullets: '<ul><li>[Describe a relevant achievement or contribution.]</li></ul>'
    }
  ]
  document.education = [{
    id: 'sample-education-1',
    institution: '[INSTITUTION]',
    degree: '[DEGREE]',
    field: '[FIELD OF STUDY]',
    location: '[LOCATION]',
    startDate: '[START DATE]',
    endDate: '[END DATE]',
    current: false
  }]
  document.projects = [{
    id: 'sample-project-1',
    name: '[PROJECT NAME]',
    role: '[YOUR ROLE]',
    url: '[PROJECT LINK]',
    startDate: '',
    endDate: '',
    bullets: '<ul><li>[Explain what you built and the outcome.]</li></ul>'
  }]
  document.certifications = [{
    id: 'sample-certification-1',
    name: '[CERTIFICATION]',
    issuer: '[ISSUER]',
    issueDate: '[DATE]',
    credentialUrl: ''
  }]
  return document
}

function value(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function plainTextToRichText(input: unknown) {
  return value(input)
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export function listToRichText(items: unknown[]) {
  const content = items.map(item => value(item)).filter(Boolean)
  return content.length ? `<ul>${content.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''
}

const allowedRichTextTags = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'ul', 'ol', 'li', 'blockquote'])

export function sanitizeRichText(input: unknown) {
  return value(input)
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?([a-z][\w-]*)\b[^>]*>/gi, (tag, name: string) => {
      if (!allowedRichTextTags.has(name.toLowerCase())) return ''
      return tag.startsWith('</') ? `</${name.toLowerCase()}>` : `<${name.toLowerCase()}>`
    })
}

function decodeHtmlEntities(input: string) {
  const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
  return input.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, code: string) => {
    if (code[0] !== '#') return named[code.toLowerCase()] ?? entity
    const decoded = code[1]?.toLowerCase() === 'x' ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10)
    return Number.isFinite(decoded) ? String.fromCodePoint(decoded) : entity
  })
}

export function richTextToPlainText(input: unknown) {
  const html = sanitizeRichText(input)
    .replace(/<ol>([\s\S]*?)<\/ol>/gi, (_list, items: string) => {
      let index = 0
      return `\n${items.replace(/<li>/gi, () => `${++index}. `)}\n`
    })
  return decodeHtmlEntities(html
    .replace(/<\/?ul>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim())
}

function descriptionToRichText(description: unknown) {
  const items = value(description)
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z])/)
    .map(item => item.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean)
  return listToRichText(items)
}

export function createResumeFromProfile(
  profile: CandidateProfile | null | undefined,
  email = ''
): ResumeDocument {
  const document = createEmptyResumeDocument()
  if (!profile) {
    document.basics.email = email
    return document
  }

  document.basics.fullName = value(profile.full_name)
  document.basics.email = email
  document.basics.summary = plainTextToRichText(profile.bio)

  document.experience = (profile.experience || []).map((item): ResumeExperience => {
    const isCurrent = Boolean(item.currently_work_here) || value(item.end_date) === 'Present'
    return {
      id: createResumeItemId(),
      title: value(item.title),
      company: value(item.company),
      location: value(item.location),
      startDate: value(item.start_date),
      endDate: isCurrent ? '' : value(item.end_date),
      current: isCurrent,
      bullets: descriptionToRichText(item.description)
    }
  })

  document.education = (profile.education || []).map((item): ResumeEducation => {
    const isCurrent = Boolean(item.not_graduated_yet) || value(item.year) === 'Not graduated yet'
    return {
      id: createResumeItemId(),
      institution: value(item.school),
      degree: value(item.degree),
      field: value(item.field),
      location: value(item.location),
      startDate: '',
      endDate: isCurrent ? '' : value(item.year),
      current: isCurrent
    }
  })

  const skills = (profile.skills || []).map(value).filter(Boolean)
  if (skills.length) {
    document.skillGroups.push({ id: createResumeItemId(), name: 'Skills', items: skills })
  }

  const links = [
    { label: 'GitHub', url: value(profile.github_url) },
    { label: 'LinkedIn', url: value(profile.linkedin_url) },
    ...(profile.portfolio_links || []).map(item => ({ label: value(item.label), url: value(item.url) }))
  ].filter(item => item.url)

  document.links = links.map(item => ({ id: createResumeItemId(), ...item }))
  return document
}

export function formatResumeDateRange(
  startDate: string,
  endDate: string,
  current = false
) {
  const end = current ? 'Present' : formatResumeDate(endDate)
  return [formatResumeDate(startDate), end].filter(Boolean).join(' – ')
}

export function formatResumeDate(input: string) {
  const value = input.trim()
  const match = value.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/)
  if (!match) return value
  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) return value
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1)))
}

export function resumeHasSectionContent(document: ResumeDocument, section: ResumeSectionKey) {
  if (section === 'summary') return Boolean(richTextToPlainText(document.basics.summary))
  return document[section === 'skills' ? 'skillGroups' : section].length > 0
}

export function sanitizeDownloadName(name: string) {
  const cleaned = name.trim().replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/g, '')
  return `${cleaned || 'resume'}.pdf`
}
