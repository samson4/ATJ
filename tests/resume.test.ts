import { describe, expect, it } from 'vitest'
import { resumeDocumentSchema } from '../shared/schemas/resume'
import { createEmptyResumeDocument, createResumeFromProfile, formatResumeDate, formatResumeDateRange, richTextToPlainText } from '../shared/utils/resume'
import { parseResumeText } from '../server/utils/resumeParser'

describe('resume document', () => {
  it('creates a valid empty version-one document', () => {
    expect(resumeDocumentSchema.parse(createEmptyResumeDocument()).sectionOrder).toHaveLength(8)
  })

  it('rejects duplicate section ordering', () => {
    const document = createEmptyResumeDocument()
    document.sectionOrder[1] = 'summary'
    expect(resumeDocumentSchema.safeParse(document).success).toBe(false)
  })

  it('copies profile data without retaining profile references', () => {
    const profile = {
      full_name: 'Marta Tesfaye',
      bio: 'Frontend engineer',
      skills: ['Vue', 'TypeScript'],
      experience: [{ title: 'Engineer', company: 'ATJ', description: 'Built accessible interfaces. Improved performance.' }],
      education: [{ school: 'AAU', degree: 'BSc', field: 'Computer Science', year: '2024' }],
      portfolio_links: [{ label: 'Portfolio', url: 'https://example.com' }]
    }
    const document = createResumeFromProfile(profile, 'marta@example.com')
    profile.skills.push('Mutation')

    expect(document.basics.email).toBe('marta@example.com')
    expect(document.skillGroups[0]?.items).toEqual(['Vue', 'TypeScript'])
    expect(richTextToPlainText(document.experience[0]?.bullets).split('\n')).toHaveLength(2)
    expect(document.links[0]?.url).toBe('https://example.com')
  })

  it('formats current date ranges', () => {
    expect(formatResumeDateRange('Jan 2024', '', true)).toBe('Jan 2024 – Present')
    expect(formatResumeDate('2024-01')).toBe('Jan 2024')
  })

  it('migrates legacy bullet arrays to rich text', () => {
    const document = createEmptyResumeDocument() as any
    document.experience.push({
      id: 'legacy', title: 'Engineer', company: '', location: '', startDate: '', endDate: '', current: false,
      bullets: ['Built a design system', 'Improved performance']
    })

    const parsed = resumeDocumentSchema.parse(document)
    expect(parsed.experience[0]?.bullets).toContain('<ul>')
    expect(richTextToPlainText(parsed.experience[0]?.bullets)).toContain('• Built a design system')
  })

  it('keeps numbered rich-text lists readable for non-HTML exports', () => {
    expect(richTextToPlainText('<ol><li>First</li><li><strong>Second</strong></li></ol>')).toBe('1. First\n2. Second')
  })
})

describe('CV text parser', () => {
  it('extracts common resume sections and contact details', () => {
    const { document, warnings } = parseResumeText(`
Marta Tesfaye
Frontend Engineer
marta@example.com | +251 911 000 000

SUMMARY
Vue engineer focused on accessible products.

EXPERIENCE
Frontend Engineer
Example PLC
Jan 2023 – Present
Improved page performance by 35%.
Built a reusable design system.

EDUCATION
Addis Ababa University
BSc Computer Science
2022

SKILLS
Vue, TypeScript, Tailwind CSS
`)

    expect(document.basics.fullName).toBe('Marta Tesfaye')
    expect(document.basics.email).toBe('marta@example.com')
    expect(document.experience[0]?.current).toBe(true)
    expect(document.skillGroups[0]?.items).toContain('Vue')
    expect(warnings.at(-1)).toContain('best-effort')
  })

  it('warns when no standard headings are present', () => {
    const result = parseResumeText('Marta Tesfaye\nmarta@example.com\nGeneral resume text that has no recognizable section headings.')
    expect(result.warnings.some(item => item.includes('No standard section'))).toBe(true)
  })
})
