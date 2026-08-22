<script setup lang="ts">
type SidebarItem = 'profile' | 'applications' | 'savedJobs' | 'security'

const props = defineProps<{
  active: SidebarItem
}>()

const itemClasses = (key: SidebarItem) => {
  if (props.active === key) {
    return 'flex items-center space-x-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800'
  }

  return 'flex items-center space-x-3 p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors'
}

const textClasses = (key: SidebarItem) => {
  if (props.active === key) {
    return 'font-medium text-primary-700 dark:text-primary-300'
  }

  return ''
}

const iconClasses = (key: SidebarItem) => {
  if (props.active === key) {
    return 'w-5 h-5 text-primary-600 dark:text-primary-400'
  }

  return 'w-5 h-5'
}
</script>

<template>
  <UCard class="sticky top-6">
    <nav class="space-y-1">
      <NuxtLink to="/profile" :class="itemClasses('profile')">
        <UIcon name="i-heroicons-user-circle" :class="iconClasses('profile')" />
        <span :class="textClasses('profile')">Profile</span>
      </NuxtLink>

      <NuxtLink to="/applications" :class="itemClasses('applications')">
        <UIcon name="i-lucide-clipboard-list" :class="iconClasses('applications')" />
        <span :class="textClasses('applications')">Applications</span>
      </NuxtLink>

      <NuxtLink to="/saved-jobs" :class="itemClasses('savedJobs')">
        <UIcon name="i-lucide-bookmark" :class="iconClasses('savedJobs')" />
        <span :class="textClasses('savedJobs')">Saved Jobs</span>
      </NuxtLink>

      <a
        href="#"
        class="flex items-center space-x-3 p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5" />
        <span>Account</span>
      </a>

      <NuxtLink to="/security" :class="itemClasses('security')">
        <UIcon name="i-heroicons-shield-check" :class="iconClasses('security')" />
        <span :class="textClasses('security')">Security</span>
      </NuxtLink>
    </nav>
  </UCard>
</template>
