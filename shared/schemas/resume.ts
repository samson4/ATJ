import { z } from 'zod'

const text = (max: number) => z.string().trim().max(max)
const richText = (max: number) => z.preprocess((value) => {
  if (!Array.isArray(value)) return value
  const escapeHtml = (item: unknown) => String(item)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const items = value.map(item => String(item).trim()).filter(Boolean)
  return items.length ? `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''
}, text(max))
const optionalUrl = text(500).refine(
  value => !value || /^https?:\/\/[^\s]+$/i.test(value),
  'Enter a valid URL beginning with http:// or https://'
)

export const resumeBasicsSchema = z.object({
  fullName: text(120),
  email: z.union([z.literal(''), z.email('Enter a valid email')]),
  phone: text(40),
  location: text(120),
  headline: text(160),
  summary: richText(12000)
})

export const resumeExperienceSchema = z.object({
  id: text(80),
  title: text(160),
  company: text(160),
  location: text(120),
  startDate: text(40),
  endDate: text(40),
  current: z.boolean(),
  bullets: richText(20000)
})

export const resumeEducationSchema = z.object({
  id: text(80),
  institution: text(200),
  degree: text(160),
  field: text(160),
  location: text(120),
  startDate: text(40),
  endDate: text(40),
  current: z.boolean()
})

export const resumeSkillGroupSchema = z.object({
  id: text(80),
  name: text(100),
  items: z.array(text(100)).max(60)
})

export const resumeProjectSchema = z.object({
  id: text(80),
  name: text(160),
  role: text(160),
  url: optionalUrl,
  startDate: text(40),
  endDate: text(40),
  bullets: richText(20000)
})

export const resumeCertificationSchema = z.object({
  id: text(80),
  name: text(180),
  issuer: text(160),
  issueDate: text(40),
  credentialUrl: optionalUrl
})

export const resumeLanguageSchema = z.object({
  id: text(80),
  name: text(100),
  proficiency: text(100)
})

export const resumeLinkSchema = z.object({
  id: text(80),
  label: text(100),
  url: optionalUrl
})

export const resumeSectionKeySchema = z.enum([
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'links'
])

export const resumeDocumentSchema = z.object({
  basics: resumeBasicsSchema,
  experience: z.array(resumeExperienceSchema).max(30),
  education: z.array(resumeEducationSchema).max(20),
  skillGroups: z.array(resumeSkillGroupSchema).max(20),
  projects: z.array(resumeProjectSchema).max(30),
  certifications: z.array(resumeCertificationSchema).max(30),
  languages: z.array(resumeLanguageSchema).max(30),
  links: z.array(resumeLinkSchema).max(30),
  sectionOrder: z.array(resumeSectionKeySchema).length(8)
}).refine(
  value => new Set(value.sectionOrder).size === value.sectionOrder.length,
  { message: 'Each resume section must appear exactly once', path: ['sectionOrder'] }
)

export const resumeRowSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  name: text(120).min(1),
  template_key: z.literal('ats-classic'),
  schema_version: z.literal(1),
  content: resumeDocumentSchema,
  source_cv_path: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
})

export const resumeImportResponseSchema = z.object({
  document: resumeDocumentSchema,
  warnings: z.array(z.string()),
  sourceCvPath: z.string()
})

export type ResumeDocument = z.output<typeof resumeDocumentSchema>
export type ResumeRow = z.output<typeof resumeRowSchema>
export type ResumeSectionKey = z.output<typeof resumeSectionKeySchema>
export type ResumeImportResponse = z.output<typeof resumeImportResponseSchema>
export type ResumeExperience = z.output<typeof resumeExperienceSchema>
export type ResumeEducation = z.output<typeof resumeEducationSchema>
export type ResumeSkillGroup = z.output<typeof resumeSkillGroupSchema>
export type ResumeProject = z.output<typeof resumeProjectSchema>
export type ResumeCertification = z.output<typeof resumeCertificationSchema>
export type ResumeLanguage = z.output<typeof resumeLanguageSchema>
export type ResumeLink = z.output<typeof resumeLinkSchema>
