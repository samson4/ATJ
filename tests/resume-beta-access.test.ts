import { describe, expect, it } from 'vitest'
import { hasResumeBuilderBetaAccess } from '../server/utils/resumeAuth'

describe('resume builder beta access', () => {
  it('allows an exact email regardless of casing or surrounding whitespace', () => {
    const allowlist = 'first@example.com, Beta.User@Example.com '

    expect(hasResumeBuilderBetaAccess('beta.user@example.com', allowlist)).toBe(true)
    expect(hasResumeBuilderBetaAccess(' BETA.USER@example.com ', allowlist)).toBe(true)
  })

  it('rejects missing and non-allowlisted emails', () => {
    expect(hasResumeBuilderBetaAccess('other@example.com', 'beta@example.com')).toBe(false)
    expect(hasResumeBuilderBetaAccess(undefined, 'beta@example.com')).toBe(false)
    expect(hasResumeBuilderBetaAccess('beta@example.com', '')).toBe(false)
  })
})
