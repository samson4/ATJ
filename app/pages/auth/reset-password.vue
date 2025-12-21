<template>
     <div class="flex flex-col items-center justify-center gap-4 p-4">
<UPageCard class="w-full max-w-md">
  <UAuthForm
        title="Reset Your Password"
        description="Enter your email to receive password reset instructions."
        icon="i-lucide-lock-open"
        :schema="schema"
        :fields="fields"
        :submit-label="'Send Reset Link'"
        @submit="resetPassword"
      >
    </UAuthForm>
    </UPageCard>
     </div>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
definePageMeta({
  layout: "auth"
})
const { $supabase } = useNuxtApp();
const toast = useToast()
const schema = z.object({
  email: z.email('Invalid email')
})
type Schema = z.output<typeof schema>
const fields: AuthFormField[] = [
{
            name: 'email',
            type: 'email',
            label: 'Email Address',
            placeholder: 'Enter your email',
            required: true,
          }]

const resetPassword = async(payload: FormSubmitEvent<Schema>)=> {
let { data, error } = await $supabase.auth.resetPasswordForEmail(payload.data.email, {
  redirectTo: `${window.location.origin}/auth/update-password`
})
if(error) {
  if(error.code){
    console.log(error.code)
  toast.add({
    title: 'Uh oh! Something went wrong.',
    description: error.message,
    icon: 'i-lucide-lock-open',
    color: 'error'
  })
}
}else{
toast.add({
    title: 'Password Reset Email Sent',
    description: 'Please check your email for further instructions.',
    icon: 'i-lucide-mail',
    color: 'success'
  })
}
}          
</script>

<style>

</style>