export const resumeAtsCategoryDefinitions = {
  fundamentals: { label: 'Contact & positioning', weight: 20 },
  structure: { label: 'Structure & ATS readability', weight: 20 },
  evidence: { label: 'Experience & impact', weight: 25 },
  skills: { label: 'Skills discoverability', weight: 15 },
  clarity: { label: 'Clarity & consistency', weight: 20 }
} as const

export type ResumeAtsCategoryKey = keyof typeof resumeAtsCategoryDefinitions
