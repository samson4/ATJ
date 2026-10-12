export default defineNuxtRouteMiddleware(async () => {
  const { $supabase } = useNuxtApp()
  const { data: { session } } = await $supabase.auth.getSession()

  if (!session) return navigateTo('/auth/signin')

  try {
    const access = await $fetch<{ enabled: boolean }>('/api/features/resume-builder', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })

    if (!access.enabled) return navigateTo('/resume-builder')
  } catch {
    return navigateTo('/resume-builder')
  }
})
