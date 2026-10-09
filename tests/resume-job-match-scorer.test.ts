import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyResumeDocument } from '../shared/utils/resume'
import {
  calculateResumeJobMatchScore,
  resetResumeJobMatchRateLimit,
  scoreResumeForJob
} from '../server/utils/resumeJobMatchScorer'

const jobText = `ROLE
Frontend Engineer
JOB DESCRIPTION
Vue experience is required. Tailwind CSS is part of our stack. React experience is a plus.`

function resume() {
  const document = createEmptyResumeDocument()
  document.basics.fullName = 'Marta Tesfaye'
  document.basics.headline = 'Frontend Engineer'
  document.experience = [{
    id: 'exp-1', title: 'Frontend Engineer', company: 'Alpha', location: '', startDate: '2022', endDate: '', current: true,
    bullets: '<ul><li>Built accessible products with Vue.</li></ul>'
  }]
  return document
}

function output() {
  return {
    summary: 'The resume demonstrates the explicitly required Vue experience and relevant frontend work.',
    categories: {
      explicitRequirements: { applicable: true, score: 90, feedback: 'Required Vue experience is demonstrated.' },
      relevantExperience: { applicable: true, score: 80, feedback: 'Frontend experience is directly relevant.' },
      transferableSkills: { applicable: true, score: 85, feedback: 'Related frontend capability is evident.' },
      responsibilities: { applicable: true, score: 75, feedback: 'The work aligns with product delivery.' },
      tailoring: { applicable: true, score: 70, feedback: 'The resume is reasonably targeted.' }
    },
    strengths: [{
      title: 'Required framework experience', detail: 'Vue experience is directly demonstrated.',
      resumeEvidence: 'Built accessible products with Vue.', jobEvidence: 'Vue experience is required.'
    }],
    improvements: [{
      title: 'Clarify relevant scope', detail: 'Add scope if it is known.', classification: 'preferred' as const,
      resumeEvidence: 'Built accessible products with Vue.', jobEvidence: 'React experience is a plus.',
      suggestedFix: 'Built accessible products with Vue, including [truthful scope or outcome].'
    }]
  }
}

beforeEach(() => resetResumeJobMatchRateLimit())

describe('job-specific resume scorer', () => {
  it('uses normalized server-side weighting', () => {
    const categories = output().categories
    expect(calculateResumeJobMatchScore(categories)).toBe(84)
    categories.explicitRequirements = { applicable: false, score: 0, feedback: 'No strict requirements.' }
    expect(calculateResumeJobMatchScore(categories)).toBe(80)
  })

  it('instructs the model not to penalize contextual technologies', async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: JSON.stringify(output()) })
    const result = await scoreResumeForJob(resume(), jobText, { userId: 'user-1', generateContent })
    const request = generateContent.mock.calls[0]![0]
    expect(result.score).toBe(84)
    expect(request.config.systemInstruction).toContain('Tailwind CSS')
    expect(request.config.systemInstruction).toContain('transferable')
    expect(request.config).not.toHaveProperty('tools')
    expect(JSON.parse(request.contents[0].parts[0].text)).toEqual({ resumeText: expect.any(String), jobText })
  })

  it('rejects evidence not found in its source document', async () => {
    const invalid = output()
    invalid.improvements[0]!.jobEvidence = 'Ten years of Tailwind CSS is mandatory.'
    await expect(scoreResumeForJob(resume(), jobText, {
      userId: 'user-2', generateContent: vi.fn().mockResolvedValue({ text: JSON.stringify(invalid) })
    })).rejects.toThrow('ungrounded')
  })
})
