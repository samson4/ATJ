import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyResumeDocument } from '../shared/utils/resume'
import {
  createResumeParseInputHash,
  parseResumeWithCache,
  resetResumeParseInFlightCache
} from '../server/utils/resumeParseCache'
import type { ResumeAiParserResult } from '../server/utils/resumeAiParser'

function createCacheClient() {
  let row: Record<string, unknown> | null = null
  let filters: Record<string, unknown> = {}
  let minimumExpiry = ''

  const builder: any = {
    select: vi.fn(() => {
      filters = {}
      minimumExpiry = ''
      return builder
    }),
    eq: vi.fn((field: string, value: unknown) => {
      filters[field] = value
      return builder
    }),
    gt: vi.fn((_field: string, value: string) => {
      minimumExpiry = value
      return builder
    }),
    maybeSingle: vi.fn(async () => {
      const matches = row
        && Object.entries(filters).every(([field, value]) => row?.[field] === value)
        && String(row.expires_at) > minimumExpiry
      return { data: matches ? row : null, error: null }
    }),
    upsert: vi.fn(async (value: Record<string, unknown>) => {
      row = { ...value }
      return { data: null, error: null }
    })
  }

  return {
    client: { from: vi.fn(() => builder) } as any,
    builder
  }
}

function result(parser: 'gemini' | 'legacy'): ResumeAiParserResult {
  return {
    document: createEmptyResumeDocument(),
    warnings: parser === 'gemini' ? ['AI result'] : ['Legacy result'],
    parser
  }
}

beforeEach(() => resetResumeParseInFlightCache())

describe('resume parse cache', () => {
  it('creates stable, context-sensitive input hashes', () => {
    expect(createResumeParseInputHash('same CV', 'user@example.com'))
      .toBe(createResumeParseInputHash('same CV', 'USER@example.com'))
    expect(createResumeParseInputHash('same CV', 'first@example.com'))
      .not.toBe(createResumeParseInputHash('same CV', 'second@example.com'))
  })

  it('reuses a valid Gemini result without another parser call', async () => {
    const cache = createCacheClient()
    const parse = vi.fn().mockResolvedValue(result('gemini'))
    const options = {
      supabase: cache.client,
      userId: 'user-1',
      fallbackEmail: 'user@example.com',
      model: 'gemini-2.5-flash',
      parse
    }

    await parseResumeWithCache('resume contents', options)
    const cached = await parseResumeWithCache('resume contents', options)

    expect(parse).toHaveBeenCalledTimes(1)
    expect(cache.builder.upsert).toHaveBeenCalledTimes(1)
    expect(cached.parser).toBe('gemini')
    expect(cached.document).toEqual(createEmptyResumeDocument())
  })

  it('does not cache legacy fallback results', async () => {
    const cache = createCacheClient()
    const parse = vi.fn().mockResolvedValue(result('legacy'))
    const options = {
      supabase: cache.client,
      userId: 'user-2',
      model: 'gemini-2.5-flash',
      parse
    }

    await parseResumeWithCache('resume contents', options)
    await parseResumeWithCache('resume contents', options)

    expect(parse).toHaveBeenCalledTimes(2)
    expect(cache.builder.upsert).not.toHaveBeenCalled()
  })

  it('coalesces simultaneous identical imports', async () => {
    const cache = createCacheClient()
    const parse = vi.fn().mockResolvedValue(result('gemini'))
    const options = {
      supabase: cache.client,
      userId: 'user-3',
      model: 'gemini-2.5-flash',
      parse
    }

    await Promise.all([
      parseResumeWithCache('resume contents', options),
      parseResumeWithCache('resume contents', options)
    ])

    expect(parse).toHaveBeenCalledTimes(1)
  })
})
