export const resumeJobMatchCategoryDefinitions = {
  explicitRequirements: { label: 'Explicit requirements', weight: 40 },
  relevantExperience: { label: 'Relevant experience', weight: 25 },
  transferableSkills: { label: 'Transferable skills', weight: 20 },
  responsibilities: { label: 'Responsibility alignment', weight: 10 },
  tailoring: { label: 'Resume tailoring', weight: 5 }
} as const

export type ResumeJobMatchCategoryKey = keyof typeof resumeJobMatchCategoryDefinitions
