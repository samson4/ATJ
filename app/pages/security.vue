<template>
  <UContainer class="py-8">
    <div class="mb-8 text-center">
      <h1 class="mb-2 text-3xl font-bold text-highlighted">
        Security
      </h1>
      <p class="text-muted">
        Manage password and account access for your profile.
      </p>
    </div>

    <div class="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="lg:col-span-1">
        <ProfileSidebar active="security" />
      </div>

      <div class="space-y-6 lg:col-span-2">
        <UCard>
          <template #header>
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-lock-keyhole" class="mt-1 size-6 text-primary" />
              <div>
                <h2 class="text-xl font-semibold text-highlighted">
                  Change Password
                </h2>
                <p class="mt-1 text-sm text-muted">
                  Ensure your account stays secure by updating your password regularly.
                </p>
              </div>
            </div>
          </template>

          <UAlert
            v-if="passwordError"
            icon="i-lucide-triangle-alert"
            color="error"
            variant="subtle"
            :title="passwordError"
            class="mb-6"
          />

          <UForm
            :state="passwordState"
            :schema="passwordSchema"
            class="space-y-6"
            @submit="changePassword"
          >
            <UFormField label="Current Password" name="currentPassword">
              <UInput
                v-model="passwordState.currentPassword"
                type="password"
                icon="i-lucide-key-round"
                placeholder="Enter your current password"
                class="w-full sm:max-w-sm"
                :disabled="changingPassword"
              />
            </UFormField>

            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <UFormField label="New Password" name="newPassword">
                <UInput
                  v-model="passwordState.newPassword"
                  type="password"
                  icon="i-lucide-lock"
                  placeholder="Enter new password"
                  class="w-full"
                  :disabled="changingPassword"
                />
              </UFormField>

              <UFormField label="Confirm New Password" name="confirmPassword">
                <UInput
                  v-model="passwordState.confirmPassword"
                  type="password"
                  icon="i-lucide-lock"
                  placeholder="Confirm new password"
                  class="w-full"
                  :disabled="changingPassword"
                />
              </UFormField>
            </div>

            <div class="flex justify-end">
              <UButton
                type="submit"
                icon="i-lucide-save"
                :loading="changingPassword"
                :disabled="changingPassword"
              >
                Update Password
              </UButton>
            </div>
          </UForm>
        </UCard>

        <UCard class="border-error/30 bg-error/10">
          <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-xl font-semibold text-highlighted">
                  Delete Account
                </h2>
                <UBadge color="error" variant="subtle">
                  Danger Zone
                </UBadge>
              </div>
              <p class="mt-4 max-w-md text-toned">
                Once your account is deactivated, you will be signed out and login access will be disabled.
              </p>
            </div>

            <UButton
              color="error"
              variant="outline"
              icon="i-lucide-trash-2"
              :disabled="deactivatingAccount"
              @click="deleteModalOpen = true"
            >
              Delete Account
            </UButton>
          </div>
        </UCard>
      </div>
    </div>

    <DisplayConfirmation
      v-model:open="deleteModalOpen"
      title="Delete Account"
      message="Are you sure you want to deactivate your account? This action disables login access, but keeps your account record and profile data for now."
      banner-title="This Action is irreversible"
      @close="deleteModalOpen = false"
      @confirm="deactivateAccount"
    />
  </UContainer>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'
import { useAuthStore } from '~/stores/auth'
import { useJobStore } from '~/stores/job'

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

useSeoMeta({
  robots: 'noindex, nofollow'
})

const { $supabase } = useNuxtApp()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const jobStore = useJobStore()

const passwordSchema = z.object({
  currentPassword: z.string().min(8, 'Must be at least 8 characters'),
  newPassword: z.string().min(8, 'Must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Must be at least 8 characters')
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match'
})

type PasswordForm = z.output<typeof passwordSchema>

const passwordState = reactive<PasswordForm>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordError = ref('')
const changingPassword = ref(false)
const deleteModalOpen = ref(false)
const deactivatingAccount = ref(false)

const resetPasswordForm = () => {
  passwordState.currentPassword = ''
  passwordState.newPassword = ''
  passwordState.confirmPassword = ''
}

const changePassword = async (event: FormSubmitEvent<PasswordForm>) => {
  changingPassword.value = true
  passwordError.value = ''

  try {
    const {
      data: { user },
      error: userError
    } = await $supabase.auth.getUser()

    if (userError) throw userError
    if (!user?.email) throw new Error('Could not verify your account email.')

    const { error: signInError } = await $supabase.auth.signInWithPassword({
      email: user.email,
      password: event.data.currentPassword
    })

    if (signInError) {
      throw new Error('Current password is incorrect.')
    }

    const { error: updateError } = await $supabase.auth.updateUser({
      password: event.data.newPassword
    })

    if (updateError) throw updateError

    resetPasswordForm()
    toast.add({
      title: 'Password updated',
      description: 'Your password has been changed successfully.',
      icon: 'i-lucide-lock-keyhole',
      color: 'success'
    })
  } catch (error: any) {
    passwordError.value = error.message || 'Could not update your password.'
    toast.add({
      title: 'Password update failed',
      description: passwordError.value,
      icon: 'i-lucide-triangle-alert',
      color: 'error'
    })
  } finally {
    changingPassword.value = false
  }
}

const deactivateAccount = async () => {
  deactivatingAccount.value = true

  try {
    const {
      data: { session },
      error: sessionError
    } = await $supabase.auth.getSession()

    if (sessionError) throw sessionError
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')

    await $fetch('/api/account/deactivate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })

    await $supabase.auth.signOut({ scope: 'local' })
    authStore.user = {}
    jobStore.clearSavedJobs()
    jobStore.clearAppliedJobs()
    deleteModalOpen.value = false

    toast.add({
      title: 'Account deactivated',
      description: 'Your account has been deactivated.',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })

    await router.push('/auth/signin')
  } catch (error: any) {
    toast.add({
      title: 'Could not delete account',
      description: error?.data?.message || error?.statusMessage || error?.message || 'Please try again.',
      icon: 'i-lucide-triangle-alert',
      color: 'error'
    })
  } finally {
    deactivatingAccount.value = false
  }
}
</script>
