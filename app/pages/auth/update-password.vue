<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
<UPageCard class="w-full max-w-md">
    <UAuthForm
        title="Update Your Password"
        description="Please enter your new password below."
        icon="i-lucide-lock"
        :schema="schema"
        :fields="fields"
        :submit-label="'Update Password'"
        @submit="updatePassword"
      >
    </UAuthForm>
    </UPageCard>
  </div>

</template>

<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";
import * as z from 'zod'

const { $supabase } = useNuxtApp();
const router = useRouter()
const toast = useToast()
const schema = z.object({
  password: z.string().min(8, "Must be at least 8 characters"),
  confirm: z.string().min(8, "Must be at least 8 characters"),
}).refine((data) => data.password === data.confirm, {
  message: "Passwords do not match",
})
type Schema = z.output<typeof schema>
const fields: AuthFormField[] = [
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    required: true,
  },
  {
    name: "confirm",
    label: "Confirm Password",
    type: "password",
    placeholder: "re-type your password",
    required: true,
  },
];   
const updatePassword = async(payload: FormSubmitEvent<Schema>)=> {
let { data, error } = await $supabase.auth.updateUser({
  password: payload.data.password,
})
if(error) {
  if(error.code){
    console.log(error.code)
  toast.add({
    title: 'Uh oh! Something went wrong.',
    description: error.message,
    icon: 'i-lucide-lock',
    color: 'error'
  })
}
}else{
toast.add({
    title: 'Password Updated Successfully',
    icon: 'i-lucide-lock',
    color: 'success'
  })
 router.push("/auth/signin")
}
}
</script>

<style>

</style>