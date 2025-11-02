<template>
  <UHeader>
    <template #left>
      <NuxtLink v-if="authUser"  to="/jobs"><AppLogo class="w-auto h-6 shrink-0" />
      </NuxtLink>
      <NuxtLink v-else to="/">
        <AppLogo class="w-auto h-6 shrink-0" />
      </NuxtLink>

      <TemplateMenu />
    </template>

    <template #right>
      <div v-if="authUser">
        <!-- <UButton v-if="authUser" to="/" color="error"  variant="outline">Sign Out</UButton> -->
        <UDropdownMenu arrow :items="items" item-text="name" :ui="{
          content: 'w-48',
        }">
          <UButton icon="i-lucide-menu" color="neutral" variant="outline" />
        </UDropdownMenu>
      </div>
      <div v-else>
        <UButton @click="signOut" to="/auth/signin" color="secondary" variant="outline">Sign In</UButton>
      </div>

      <UColorModeButton />
    </template>
  </UHeader>
  <UMain class="m-8 flex justify-center">
    <slot />
  </UMain>
  <USeparator />
  <UFooter>
    <template #left>
      <p class="text-sm text-muted">
        Built with Nuxt UI • © {{ new Date().getFullYear() }}
      </p>
    </template>

    <template #right>
      <UButton to="https://github.com/nuxt-ui-templates/starter" target="_blank" icon="i-simple-icons-github"
        aria-label="GitHub" color="neutral" variant="ghost" />
    </template>
  </UFooter>
</template>

<script setup lang="ts">
//init
const { $supabase } = useNuxtApp();
const router = useRouter();

//data

const authUser = ref(null);
const items = ref([
  { label: "Profile", icon: "lucide:user", to: "/profile" },
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
  }
});

//methods

const signOut = async () => {
  let { error } = await $supabase.auth.signOut();

  if (error) throw error;
  router.push("/auth/signin");
};
</script>

<style></style>
