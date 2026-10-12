import { z } from 'zod'
import { requireServerSupabase } from '../../utils/serverSupabase'

const waitlistSchema = z.object({
  email: z.email().max(320)
}).strict()

export default defineEventHandler(async (event) => {
  const request = waitlistSchema.safeParse(await readBody(event))

  if (!request.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Enter a valid email address'
    })
  }

  const supabase = requireServerSupabase(event)
  const email = request.data.email.trim().toLowerCase()
  const { error } = await supabase
    .from('resume_builder_waitlist')
    .insert({ email })

  setResponseHeader(event, 'Cache-Control', 'no-store')

  if (!error) return { joined: true, alreadyJoined: false }
  if (error.code === '23505') return { joined: false, alreadyJoined: true }

  console.error('Could not add resume builder waitlist entry', {
    code: error.code,
    message: error.message
  })

  throw createError({
    statusCode: 500,
    statusMessage: 'We could not add you right now. Please try again.'
  })
})
