import { z } from 'zod'

export const resumeTemplateKeySchema = z.enum([
  'ats-classic',
  'modern-minimal',
  'centered-professional',
  'executive',
  'compact',
  'structured',
  'editorial-air',
  'career-ledger',
  'resume-no'
])

export type ResumeTemplateKey = z.output<typeof resumeTemplateKeySchema>

export type ResumeTemplateDefinition = {
  key: ResumeTemplateKey
  name: string
  description: string
  order: number
}

export const resumeTemplates = [
  {
    key: 'ats-classic',
    name: 'ATS Classic',
    description: 'A traditional, left-aligned resume with uppercase section headings and thin dividers.',
    order: 1
  },
  {
    key: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'A spacious resume with oversized identity text and a restrained, rule-free hierarchy.',
    order: 2
  },
  {
    key: 'centered-professional',
    name: 'Centered Professional',
    description: 'A polished resume with a centered masthead and balanced section dividers.',
    order: 3
  },
  {
    key: 'executive',
    name: 'Executive',
    description: 'A formal resume with a strong masthead, double rules, and right-aligned metadata.',
    order: 4
  },
  {
    key: 'compact',
    name: 'Compact',
    description: 'A dense resume that fits more experience through tighter typography and spacing.',
    order: 5
  },
  {
    key: 'structured',
    name: 'Structured',
    description: 'A precise resume with outlined section labels and clear row separators.',
    order: 6
  },
  {
    key: 'editorial-air',
    name: 'Editorial Air',
    description: 'A spacious, left-aligned layout with generous breathing room and a clear editorial hierarchy.',
    order: 7
  },
  {
    key: 'career-ledger',
    name: 'Career Ledger',
    description: 'A structured, scan-friendly design with right-aligned metadata and subtle dividers between entries.',
    order: 8
  },
  {
    key: 'resume-no',
    name: 'Resume NO',
    description: 'A clean grayscale layout with a centered header, compact contact links, fine section rules, and neatly spaced experience details.',
    order: 9
  }
] as const satisfies readonly ResumeTemplateDefinition[]

export const resumeTemplateByKey = Object.fromEntries(
  resumeTemplates.map(template => [template.key, template])
) as Record<ResumeTemplateKey, ResumeTemplateDefinition>
