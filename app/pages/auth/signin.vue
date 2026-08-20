<script setup lang="ts">

definePageMeta({
  layout:"auth"
})
useSeoMeta({
  robots: 'noindex, nofollow'
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
      if (error) {
          toast.add({
    title: 'Uh oh! Something went wrong.',
    description: error.message,
    icon: 'i-lucide-user',
    color: 'error'
  })
      }else{

     toast.add({
    title: 'Login Successful',
    icon: 'i-lucide-user',
    color: 'success'
  })
router.push("/")
      }
      
      
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
if(error) {
  if(error.code){
    console.log(error.code)
  toast.add({
    title: 'Uh oh! Something went wrong.',
    description: error.message,
    icon: 'i-lucide-user',
    color: 'error'
  })
}
}else{
toast.add({
    title: 'Login Successful',
    icon: 'i-lucide-user',
    color: 'success'
  })
router.push("/")
}
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
      >

    <template #password-hint>
      <ULink
        to="/auth/reset-password"
        class="text-primary font-medium"
        tabindex="-1"
      >Forgot password?</ULink>
    </template>
    </UAuthForm>
    </UPageCard>
    
        <ULink class="flex flex-col justify-center"  to="/auth/signup">Or Create an account.</ULink>
     </div>   
</template>
