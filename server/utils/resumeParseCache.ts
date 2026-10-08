import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { resumeDocumentSchema } from '~~/shared/schemas/resume'
import {
  AI_RESUME_REVIEW_WARNING,
  RESUME_AI_PARSER_VERSION,
  parseResumeWithAiFallback,
  type ResumeAiParserOptions,
  type ResumeAiParserResult
} from './resumeAiParser'

const CACHE_TABLE = 'resume_parse_cache'
const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000
const DEFAULT_MODEL = 'gemini-3.8-flash'

type CacheClient = Pick<SupabaseClient, 'from'>
type ParseResume = (
  rawText: string,
  options: ResumeAiParserOptions
) => Promise<ResumeAiParserResult>

export interface ResumeParseCacheOptions extends ResumeAiParserOptions {
  supabase: CacheClient
  parse?: ParseResume
}

const inFlightParses = new Map<string, Promise<ResumeAiParserResult>>()

export function createResumeParseInputHash(rawText: string, fallbackEmail = '') {
  return createHash('sha256')
    .update('resume-text\0')
    .update(rawText)
    .update('\0fallback-email\0')
    .update(fallbackEmail.trim().toLocaleLowerCase('en'))
    .digest('hex')
}

function normalizedModel(model?: string) {
  return (model || DEFAULT_MODEL).trim().toLocaleLowerCase('en').replace(/^models\//, '')
}

async function readCachedDocument(
  supabase: CacheClient,
  userId: string,
  inputHash: string,
  model: string
) {
  const { data, error } = await supabase
    .from(CACHE_TABLE)
    .select('resume_document')
    .eq('user_id', userId)
    .eq('input_hash', inputHash)
    .eq('parser_version', RESUME_AI_PARSER_VERSION)
    .eq('model', model)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error || !data) return null
  const parsed = resumeDocumentSchema.safeParse(data.resume_document)
  return parsed.success ? parsed.data : null
}

async function writeCachedDocument(
  supabase: CacheClient,
  userId: string,
  inputHash: string,
  model: string,
  result: ResumeAiParserResult
) {
  if (result.parser !== 'gemini') return

  const now = new Date()
  await supabase.from(CACHE_TABLE).upsert({
    user_id: userId,
    input_hash: inputHash,
    parser_version: RESUME_AI_PARSER_VERSION,
    model,
    resume_document: result.document,
    updated_at: now.toISOString(),
    expires_at: new Date(now.getTime() + CACHE_TTL_MS).toISOString()
  }, { onConflict: 'user_id,input_hash,parser_version,model' })
}

async function parseWithPersistentCache(
  rawText: string,
  options: ResumeParseCacheOptions,
  inputHash: string,
  model: string
) {
  // Cache failures are intentionally non-fatal. This lets imports continue
  // before the table is installed or during a transient database problem.
  try {
    const document = await readCachedDocument(options.supabase, options.userId, inputHash, model)
    if (document) {
      return {
        document,
        warnings: [AI_RESUME_REVIEW_WARNING],
        parser: 'gemini' as const
      }
    }
  } catch {
    // Continue to the parser.
  }

  const { supabase: _supabase, parse, ...parserOptions } = options
  const result = await (parse || parseResumeWithAiFallback)(rawText, parserOptions)

  try {
    await writeCachedDocument(options.supabase, options.userId, inputHash, model, result)
  } catch {
    // A successful import must not fail because the cache could not be saved.
  }

  return result
}

export async function parseResumeWithCache(
  rawText: string,
  options: ResumeParseCacheOptions
): Promise<ResumeAiParserResult> {
  const model = normalizedModel(options.model)
  const inputHash = createResumeParseInputHash(rawText, options.fallbackEmail)
  const cacheKey = `${options.userId}:${inputHash}:${RESUME_AI_PARSER_VERSION}:${model}`
  const active = inFlightParses.get(cacheKey)
  if (active) return active

  const pending = parseWithPersistentCache(rawText, options, inputHash, model)
  inFlightParses.set(cacheKey, pending)
  try {
    return await pending
  } finally {
    if (inFlightParses.get(cacheKey) === pending) inFlightParses.delete(cacheKey)
  }
}

export function resetResumeParseInFlightCache() {
  inFlightParses.clear()
}
