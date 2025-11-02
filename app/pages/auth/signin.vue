<script setup lang="ts">

definePageMeta({
  layout:"auth"
})
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
const { $supabase } = useNuxtApp()
const envConfig = useRuntimeConfig();
const toast = useToast()
const router = useRouter()
const fields: AuthFormField[] = [{
  name: 'email',
  type: 'email',
  label: 'Email',
  placeholder: 'Enter your email',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password',
  placeholder: 'Enter your password',
  required: true
}, {
  name: 'remember',
  label: 'Remember me',
  type: 'checkbox'
},
]

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons-google',
      onClick: async () => {
      let { data, error } = await $supabase.auth.signInWithOAuth({
        provider: "google",
         options: {
    redirectTo: envConfig.public.FRONTEND_REDIRECT_URL,
  },
      });
      if (error) throw error
      // router.push("/jobs")
      // toast.add({ title: "Google", description: "Login with Google" });
      
    },
}, ]

const schema = z.object({
  email: z.email('Invalid email'),
  password: z.string('Password is required').min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

const onSubmit = async(payload: FormSubmitEvent<Schema>)=> {

let { data, error } = await $supabase.auth.signInWithPassword({
  email: payload.data.email,
  password: payload.data.password
})
if(error) throw error;
router.push("/jobs")
}
</script>

<template>
   <div class="flex flex-col items-center justify-center gap-4 p-4">
<UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="Login"
        description="Enter your credentials to access your account."
        icon="i-lucide-user"
        :fields="fields"
        :providers="providers"
        @submit="onSubmit"
      />
    </UPageCard>
    
        <ULink class="flex flex-col justify-center"  to="/auth/signup">Or Create an account.</ULink>
     </div>   
</template>

