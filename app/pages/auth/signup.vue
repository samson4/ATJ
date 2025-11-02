<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";
const { $supabase } = useNuxtApp()
const router = useRouter()
const envConfig = useRuntimeConfig();
definePageMeta({
  layout: "auth"
});
const toast = useToast();

const fields: AuthFormField[] = [
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "Enter your email",
    required: true,
  },
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

const providers = [
  {
    label: "Google",
    icon: "i-simple-icons-google",
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
      // console.log("data",data)
    },
  },
];

const schema = z
  .object({
    email: z.email("Invalid email"),
    password: z.string().min(8, "Must be at least 8 characters"),
    confirm: z.string().min(8, "Must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type Schema = z.output<typeof schema>;

const onSubmit = async(payload: FormSubmitEvent<Schema>)=> {
console.log("payload",payload.data.email)
let { data, error } = await $supabase.auth.signUp({
  email: payload.data.email,
  password: payload.data.password
})
if (error) throw error

router.push("/auth/signin")
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="Register"
        description="Create account to join Addis Tech Jobs"
        icon="i-lucide-user"
        :fields="fields"
        :providers="providers"
        @submit="onSubmit"
      />
    </UPageCard>

    <ULink class="flex flex-col justify-center" to="/auth/signin"
      >Already have an account? Signin.</ULink
    >
  </div>
</template>
