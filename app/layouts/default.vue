<template>
  <UHeader>
    <template #left>
      <NuxtLink v-if="authUser" to="/"
        ><AppLogo class="w-auto h-12 "/>
      </NuxtLink>
      <NuxtLink v-else to="/">
        <AppLogo class="w-auto h-12 " />
      </NuxtLink>

    </template>

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
  <UMain class="flex flex-col gap-4 mx-12">
    <slot />
  </UMain>
  <AppFooter />
</template>

<script setup lang="ts">
//init
import { useAuthStore } from "~/stores/auth"
import { useJobStore } from "~/stores/job"
const { $supabase } = useNuxtApp();
const router = useRouter();

//data
const authStore = useAuthStore()
const jobStore = useJobStore()
const authUser = ref(null);
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
    console.log("auth",authStore)
  }
});

//methods

const signOut = async () => {
  let { error } = await $supabase.auth.signOut();
  authStore.user = {}
  authUser.value = null
  jobStore.clearSavedJobs()
  jobStore.clearAppliedJobs()
  if (error) throw error;
  router.push("/auth/signin");
};
</script>

<style></style>
