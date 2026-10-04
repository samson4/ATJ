import { readFileSync } from 'node:fs'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { describe, expect, it, vi } from 'vitest'
import { resumeDocumentSchema, resumeImportResponseSchema, resumePreviewRequestSchema, resumeSaveRequestSchema } from '../shared/schemas/resume'
import { resumeTemplateKeySchema, resumeTemplates } from '../shared/data/resumeTemplates'
import type { ResumeTemplateKey } from '../shared/types/resume'
import { createEmptyResumeDocument, createResumeFromProfile, createResumeTemplatePreviewDocument, formatResumeDate, formatResumeDateRange, isResumeDocumentEmpty, richTextToPlainText } from '../shared/utils/resume'
import { parseResumeText } from '../server/utils/resumeParser'
import { renderResumePdf, resumeTemplateLayouts } from '../server/utils/resumePdf'

vi.stubGlobal('useStorage', () => ({
  getItemRaw: async (key: string) => readFileSync(new URL(`../server/assets/resume-fonts/${key}`, import.meta.url))
}))

describe('resume templates', () => {
  it('has six ordered templates with unique keys and names', () => {
    expect(resumeTemplates).toHaveLength(6)
    expect(new Set(resumeTemplates.map(item => item.key))).toHaveLength(6)
    expect(new Set(resumeTemplates.map(item => item.name))).toHaveLength(6)
    expect(resumeTemplates.map(item => item.order)).toEqual([1, 2, 3, 4, 5, 6])
    expect(new Set(Object.values(resumeTemplateLayouts).map(layout => layout.style))).toHaveLength(6)
    expect(resumeTemplateLayouts['ats-classic']).toMatchObject({
      pageMargin: 44,
      bodySize: 9,
      rowTitleSize: 10,
      nameSize: 22,
      headlineSize: 11,
      detailsIndent: 8,
      richLineGap: 1,
      rowGap: 0.35,
      style: 'classic'
    })
  })

  it('accepts supported template keys and rejects unknown keys', () => {
    resumeTemplates.forEach(template => expect(resumeTemplateKeySchema.safeParse(template.key).success).toBe(true))
    expect(resumeTemplateKeySchema.safeParse('colorful-photo').success).toBe(false)
  })

  it('validates key-aware preview requests', () => {
    const document = createEmptyResumeDocument()
    expect(resumePreviewRequestSchema.safeParse({ document, templateKey: 'structured' }).success).toBe(true)
    expect(resumePreviewRequestSchema.safeParse({ document, templateKey: 'unknown' }).success).toBe(false)
  })

  it('requires a supported template key when saving', () => {
    const content = createEmptyResumeDocument()
    expect(resumeSaveRequestSchema.safeParse({ name: 'Resume', template_key: 'compact', content }).success).toBe(true)
    expect(resumeSaveRequestSchema.safeParse({ name: 'Resume', template_key: 'unknown', content }).success).toBe(false)
    expect(resumeSaveRequestSchema.safeParse({ name: 'Resume', content }).success).toBe(false)
  })

  it('distinguishes a ready CV import from one that requires an upload', () => {
    const document = createEmptyResumeDocument()
    expect(resumeImportResponseSchema.safeParse({
      status: 'ready', document, warnings: [], sourceCvPath: 'user/cv/resume.pdf'
    }).success).toBe(true)
    expect(resumeImportResponseSchema.safeParse({
      status: 'cv-required', warning: 'Upload a PDF CV to continue.'
    }).success).toBe(true)
  })

  it('renders every layout with rich text and Ethiopic content', async () => {
    const document = createEmptyResumeDocument()
    document.basics = {
      fullName: 'ማርታ Tesfaye',
      email: 'marta@example.com',
      phone: '+251 911 000 000',
      location: 'Addis Ababa',
      headline: 'Frontend Engineer',
      summary: '<p>Accessible product engineer with <strong>six years</strong> of experience.</p>'
    }
    document.experience.push({
      id: 'experience-1', title: 'Senior Engineer', company: 'Example PLC', location: 'Addis Ababa',
      startDate: '2022-01', endDate: '', current: true,
      bullets: '<ul><li>Built accessible interfaces.</li><li><em>Improved</em> performance.</li></ul>'
    })

    const sizes = new Set<number>()
    for (const template of resumeTemplates) {
      const pdf = await renderResumePdf(document, template.key)
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
      expect(pdf.length).toBeGreaterThan(5_000)
      sizes.add(pdf.length)
    }
    expect(sizes.size).toBeGreaterThan(1)
  }, 30_000)

  it('renders empty and multi-page documents with every layout', async () => {
    const emptyDocument = createEmptyResumeDocument()
    const longDocument = createEmptyResumeDocument()
    longDocument.basics.fullName = 'Long Resume'
    longDocument.basics.summary = `<p>${'Detailed professional achievement and measurable outcome. '.repeat(300)}</p>`

    for (const template of resumeTemplates) {
      const emptyPdf = await renderResumePdf(emptyDocument, template.key)
      expect(emptyPdf.subarray(0, 5).toString()).toBe('%PDF-')

      const longPdf = await renderResumePdf(longDocument, template.key)
      const pageCount = longPdf.toString('latin1').match(/\/Type \/Page\b/g)?.length ?? 0
      expect(pageCount).toBeGreaterThan(1)
    }
  }, 30_000)

  it('rejects an unsupported renderer key', async () => {
    await expect(renderResumePdf(createEmptyResumeDocument(), 'unknown' as ResumeTemplateKey))
      .rejects.toThrow('Unsupported resume template')
  })

  it('keeps executive row metadata level with its title', async () => {
    const document = createEmptyResumeDocument()
    document.experience.push({
      id: 'experience-1',
      title: 'Software Engineer',
      company: 'Example PLC',
      location: 'Addis Ababa, Ethiopia',
      startDate: '2022-09',
      endDate: '2023-09',
      current: false,
      bullets: '<ul><li>Built reliable software.</li></ul>'
    })

    const rendered = await renderResumePdf(document, 'executive')
    const parsed = await getDocument({ data: new Uint8Array(rendered), disableWorker: true }).promise
    try {
      const page = await parsed.getPage(1)
      const content = await page.getTextContent()
      const title = content.items.find((item: any) => item.str?.includes('Software Engineer')) as any
      const metadata = content.items.find((item: any) => item.str?.includes('Addis Ababa')) as any
      const achievement = content.items.find((item: any) => item.str?.includes('Built reliable software')) as any

      expect(title).toBeTruthy()
      expect(metadata).toBeTruthy()
      expect(achievement).toBeTruthy()
      expect(Math.abs(title.transform[5] - metadata.transform[5])).toBeLessThan(4)
      expect(achievement.transform[4]).toBeGreaterThanOrEqual(title.transform[4])
      expect(achievement.transform[4]).toBeLessThan(metadata.transform[4])
    } finally {
      await parsed.destroy()
    }
  })
})

describe('resume document', () => {
  it('creates a valid empty version-one document', () => {
    expect(resumeDocumentSchema.parse(createEmptyResumeDocument()).sectionOrder).toHaveLength(8)
  })

  it('provides valid sample content only for empty template previews', () => {
    const emptyDocument = createEmptyResumeDocument()
    const sampleDocument = createResumeTemplatePreviewDocument()

    expect(isResumeDocumentEmpty(emptyDocument)).toBe(true)
    expect(isResumeDocumentEmpty(sampleDocument)).toBe(false)
    expect(resumeDocumentSchema.safeParse(sampleDocument).success).toBe(true)
    expect(sampleDocument.basics.fullName).toBe('[YOUR NAME]')
    expect(emptyDocument.basics.fullName).toBe('')
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

  it('keeps partially entered contact values saveable as a draft', () => {
    const document = createEmptyResumeDocument()
    document.basics.email = 'marta@'
    document.projects.push({
      id: 'draft-project', name: 'Portfolio', role: '', url: 'https://', startDate: '', endDate: '', bullets: ''
    })

    expect(resumeDocumentSchema.safeParse(document).success).toBe(true)
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
