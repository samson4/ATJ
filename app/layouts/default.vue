<template>
  <UHeader :toggle="false">
    <template #left>
      <NuxtLink v-if="authUser" to="/"
        ><AppLogo class="w-auto h-12 "/>
      </NuxtLink>
      <NuxtLink v-else to="/">
        <AppLogo class="w-auto h-12 " />
      </NuxtLink>

    </template>

    <NuxtLink
      v-if="authUser && resumeBuilderEnabled"
      to="/resumes"
      class="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-toned transition-colors hover:bg-elevated hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-3 sm:text-base"
      active-class="bg-elevated text-primary"
    >
      <span class="sm:hidden">Resume</span>
      <span class="hidden sm:inline">Resume Builder</span>
    </NuxtLink>

    <template #right>
      <div v-if="authUser">
        <!-- <UButton v-if="authUser" to="/" color="error"  variant="outline">Sign Out</UButton> -->
        <UDropdownMenu
          arrow
          :items="items"
          item-text="name"
          :ui="{
            content: 'w-48',
          }"
        >
          <UButton icon="i-lucide-menu" color="neutral" variant="outline" />
        </UDropdownMenu>
      </div>
      <div v-else>
        <UButton
          @click="signOut"
          to="/auth/signin"
          color="secondary"
          variant="outline"
          >Sign In</UButton
        >
      </div>

      <UColorModeButton />
    </template>
  </UHeader>
  <UMain class="flex flex-col gap-4 mx-2 sm:mx-6 xl:mx-12">
    <slot />
  </UMain>
  <AppFooter />
</template>

<script setup lang="ts">
//init
import type { User } from '@supabase/supabase-js'
import { useAuthStore } from "~/stores/auth"
import { useJobStore } from "~/stores/job"
const { $supabase } = useNuxtApp();
const router = useRouter();

//data
const authStore = useAuthStore()
const jobStore = useJobStore()
const authUser = ref<User | null>(null);
const resumeBuilderEnabled = ref(false)
const items = ref([
  { label: "Profile", icon: "lucide:user", to: "/profile" },
  { label: "Saved Jobs", icon: "i-lucide-bookmark", to: "/saved-jobs" },
  {
    label: "Sign Out",
    icon: "lucide:log-out",
    onClick: async () => {
      signOut();
    },
  },
]);

//hoooks
onMounted(async () => {
  const {
    data: { user },
  } = await $supabase.auth.getUser();
  if (user) {
    authUser.value = user;
    authStore.user = user
    jobStore.fetchSavedJobIds()
    jobStore.fetchAppliedJobIds()

    const { data: { session } } = await $supabase.auth.getSession()
    if (session?.access_token) {
      try {
        const access = await $fetch<{ enabled: boolean }>('/api/features/resume-builder', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        resumeBuilderEnabled.value = access.enabled
      } catch {
        resumeBuilderEnabled.value = false
      }
    }
  }
});

//methods

const signOut = async () => {
  let { error } = await $supabase.auth.signOut();
  authStore.user = {}
  authUser.value = null
  resumeBuilderEnabled.value = false
  jobStore.clearSavedJobs()
  jobStore.clearAppliedJobs()
  if (error) throw error;
  router.push("/auth/signin");
};
</script>

<style></style>
