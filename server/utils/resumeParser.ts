import type { ResumeDocument, ResumeSectionKey } from '~~/shared/types/resume'
import { createEmptyResumeDocument, createResumeItemId, listToRichText, plainTextToRichText } from '~~/shared/utils/resume'

const sectionAliases: Array<[RegExp, ResumeSectionKey]> = [
  [/^(?:(?:professional\s+)?summary|profile|objective|about me)$/i, 'summary'],
  [/^(?:(?:work\s+)?experience|employment(?: history)?|work history)$/i, 'experience'],
  [/^(?:education|academic background)$/i, 'education'],
  [/^(?:(?:technical\s+)?skills|competencies|technologies)$/i, 'skills'],
  [/^(?:projects?|selected projects)$/i, 'projects'],
  [/^(?:certifications?|licenses(?: and certifications)?)$/i, 'certifications'],
  [/^languages?$/i, 'languages'],
  [/^(?:links|portfolio|profiles)$/i, 'links']
]

// Bounded components avoid pathological backtracking on malformed or hostile
// PDF text while still covering the practical maximum email lengths.
const emailPattern = /[A-Z0-9._%+-]{1,64}@[A-Z0-9.-]{1,253}\.[A-Z]{2,63}/i
const phonePattern = /(?:\+?\d[\d\s().-]{7,}\d)/
const urlPattern = /https?:\/\/[^\s]+|(?:www\.)[^\s]+/i
const dateRangePattern = /(.{0,30}?)(?:\s+[-–—]\s+)(present|current|now|.{1,30})$/i

function cleanLine(line: string) {
  return line.replace(/^\s*[•●▪◦*\-]\s*/, '').replace(/\s+/g, ' ').trim()
}

function sectionForLine(line: string) {
  const normalized = line.replace(/[:|]$/, '').trim()
  return sectionAliases.find(([pattern]) => pattern.test(normalized))?.[1]
}

function blocks(lines: string[]) {
  const output: string[][] = []
  let current: string[] = []
  for (const line of lines) {
    if (!line.trim()) {
      if (current.length) output.push(current.splice(0))
      continue
    }
    current.push(line)
  }
  if (current.length) output.push(current)
  return output
}

function parseDates(line = '') {
  const match = line.match(dateRangePattern)
  if (!match) return { startDate: '', endDate: '', current: false }
  const end = cleanLine(match[2] || '')
  const current = /^(present|current|now)$/i.test(end)
  return { startDate: cleanLine(match[1] || ''), endDate: current ? '' : end, current }
}

export function parseResumeText(rawText: string, fallbackEmail = ''): {
  document: ResumeDocument
  warnings: string[]
} {
  const document = createEmptyResumeDocument()
  const warnings: string[] = []
  const lines = rawText.replace(/\r/g, '').split('\n').map(line => line.trim())
  const sections = new Map<ResumeSectionKey, string[]>()
  const prelude: string[] = []
  let activeSection: ResumeSectionKey | null = null

  for (const line of lines) {
    const detected = sectionForLine(line)
    if (detected) {
      activeSection = detected
      if (!sections.has(detected)) sections.set(detected, [])
      continue
    }
    if (activeSection) sections.get(activeSection)?.push(line)
    else prelude.push(line)
  }

  const allText = lines.join(' ')
  document.basics.email = allText.match(emailPattern)?.[0] || fallbackEmail
  document.basics.phone = cleanLine(allText.match(phonePattern)?.[0] || '')
  document.basics.fullName = cleanLine(prelude.find(line => {
    return line && !emailPattern.test(line) && !phonePattern.test(line) && !urlPattern.test(line)
  }) || '')

  const headlineCandidates = prelude.filter(line => {
    return line && line !== document.basics.fullName && !emailPattern.test(line) && !phonePattern.test(line)
  })
  document.basics.headline = cleanLine(headlineCandidates[0] || '')
  document.basics.summary = plainTextToRichText((sections.get('summary') || []).filter(Boolean).join(' ').slice(0, 2000))

  const experienceBlocks = blocks(sections.get('experience') || [])
  document.experience = experienceBlocks.slice(0, 30).map((block) => {
    const dateLine = block.find(line => dateRangePattern.test(line)) || ''
    const content = block.filter(line => line !== dateLine).map(cleanLine).filter(Boolean)
    return {
      id: createResumeItemId(),
      title: content[0] || '',
      company: content[1] || '',
      location: '',
      ...parseDates(dateLine),
      bullets: listToRichText(content.slice(2, 22))
    }
  })

  const educationBlocks = blocks(sections.get('education') || [])
  document.education = educationBlocks.slice(0, 20).map((block) => {
    const dateLine = block.find(line => dateRangePattern.test(line) || /\b(19|20)\d{2}\b/.test(line)) || ''
    const content = block.filter(line => line !== dateLine).map(cleanLine).filter(Boolean)
    const dates = parseDates(dateLine)
    return {
      id: createResumeItemId(),
      institution: content[0] || '',
      degree: content[1] || '',
      field: content[2] || '',
      location: '',
      startDate: dates.startDate,
      endDate: dates.endDate || cleanLine(dateLine),
      current: dates.current
    }
  })

  const skillLines = (sections.get('skills') || []).map(cleanLine).filter(Boolean)
  const skills = skillLines.flatMap(line => line.split(/[,|•]/).map(cleanLine)).filter(Boolean)
  if (skills.length) {
    document.skillGroups.push({ id: createResumeItemId(), name: 'Skills', items: skills.slice(0, 60) })
  }

  document.projects = blocks(sections.get('projects') || []).slice(0, 30).map((block) => ({
    id: createResumeItemId(),
    name: cleanLine(block[0] || ''),
    role: '',
    url: block.join(' ').match(urlPattern)?.[0]?.replace(/^www\./, 'https://www.') || '',
    startDate: '',
    endDate: '',
    bullets: listToRichText(block.slice(1).map(cleanLine).filter(line => !urlPattern.test(line)).slice(0, 20))
  }))

  document.certifications = (sections.get('certifications') || []).map(cleanLine).filter(Boolean).slice(0, 30).map(line => ({
    id: createResumeItemId(), name: line, issuer: '', issueDate: '', credentialUrl: ''
  }))
  document.languages = (sections.get('languages') || []).map(cleanLine).filter(Boolean).slice(0, 30).map(line => {
    const [name = '', proficiency = ''] = line.split(/[:|–—-]/, 2).map(cleanLine)
    return { id: createResumeItemId(), name, proficiency }
  })

  const urls = Array.from(new Set(allText.match(new RegExp(urlPattern.source, 'gi')) || []))
  document.links = urls.slice(0, 30).map((url) => ({
    id: createResumeItemId(),
    label: /linkedin/i.test(url) ? 'LinkedIn' : /github/i.test(url) ? 'GitHub' : 'Portfolio',
    url: url.replace(/^www\./, 'https://www.')
  }))

  if (!document.basics.fullName) warnings.push('We could not confidently identify your name.')
  if (!sections.size) warnings.push('No standard section headings were detected; review all imported fields.')
  if (!document.experience.length && !document.education.length) {
    warnings.push('No experience or education entries were detected.')
  }
  warnings.push('CV imports are best-effort. Review dates, headings, and bullet grouping before using this resume.')
  return { document, warnings }
}
