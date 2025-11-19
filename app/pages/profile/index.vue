<template>
  <UContainer class="py-8">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Profile Settings
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Manage your account settings and preferences
      </p>
    </div>

    <div class="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Sidebar Navigation -->
      <div class="lg:col-span-1">
        <UCard class="sticky top-6">
          <nav class="space-y-1">
            <div
              class="flex items-center space-x-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
            >
              <UIcon
                name="i-heroicons-user-circle"
                class="w-5 h-5 text-primary-600 dark:text-primary-400"
              />
              <span class="font-medium text-primary-700 dark:text-primary-300"
                >Profile</span
              >
            </div>
            <a
              href="#"
              class="flex items-center space-x-3 p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5" />
              <span>Account</span>
            </a>
            <a
              href="#"
              class="flex items-center space-x-3 p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <UIcon name="i-heroicons-bell" class="w-5 h-5" />
              <span>Notifications</span>
            </a>
            <a
              href="#"
              class="flex items-center space-x-3 p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <UIcon name="i-heroicons-shield-check" class="w-5 h-5" />
              <span>Security</span>
            </a>
          </nav>
        </UCard>
      </div>

      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <UCard>
          <template #header>
            <div class="flex items-center space-x-2">
              <UIcon
                name="i-heroicons-user-circle"
                class="w-6 h-6 text-primary-600 dark:text-primary-400"
              />
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Profile Information
              </h2>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Update your photo and personal details here.
            </p>
          </template>

          <UAlert
            v-if="successMessage"
            icon="i-heroicons-check-circle"
            color="success"
            variant="subtle"
            :title="successMessage"
            class="mb-6"
          />
          <UAlert
            v-if="errorMessage"
            icon="i-heroicons-exclamation-triangle"
            color="error"
            variant="subtle"
            :title="errorMessage"
            class="mb-6"
          />

          <UForm
            :state="state"
            :schema="schema"
            class="space-y-6"
            @submit="saveProfile"
          >
            <!-- Profile Photo Section -->
            <div
              class="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <div class="relative group">
                <UAvatar
                  :src="
                    avatarPreview ||
                    state.picture ||
                    'https://avatars.githubusercontent.com/u/739984?v=4'
                  "
                  alt="Avatar"
                  size="3xl"
                  class="ring-4 ring-white dark:ring-gray-900 shadow-lg"
                />
                <div
                  class="absolute inset-0 bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <UIcon name="i-heroicons-camera" class="w-6 h-6 text-white" />
                </div>
              </div>

              <div class="flex-1 space-y-3">
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    Profile Photo
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    JPG, GIF or PNG. Max size 2MB.
                  </p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <UButton
                    label="Upload new photo"
                    color="primary"
                    variant="solid"
                    size="sm"
                    @click="fileInputRef?.click()"
                    icon="i-heroicons-cloud-arrow-up"
                  />
                  <UButton
                    label="Remove"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    @click="removeAvatar"
                    icon="i-heroicons-trash"
                  />
                  <input
                    ref="fileInputRef"
                    type="file"
                    class="hidden"
                    accept="image/*"
                    @change="onFileChange"
                  />
                </div>
              </div>
            </div>

            <!-- Personal Information -->
            <div class="space-y-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Personal Information
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UFormField label="Full Name" name="name">
                  <UInput
                    v-model="state.name"
                    placeholder="Your full name"
                    size="lg"
                    icon="i-heroicons-user"
                    :ui="{ icon: { trailing: { pointer: '' } } }"
                  />
                </UFormField>

                <UFormField label="Email Address" name="email">
                  <UInput
                    v-model="state.email"
                    type="email"
                    placeholder="Your email address"
                    disabled
                    size="lg"
                    icon="i-heroicons-envelope"
                  />
                </UFormField>
              </div>

              <UFormField
                label="Bio"
                name="bio"
                hint="Brief description for your profile. URLs are hyperlinked."
              >
                <UTextarea
                  v-model="state.bio"
                  placeholder="Tell us about yourself..."
                  :rows="4"
                  autoresize
                  :maxlength="200"
                  class="resize-none"
                />
                <template #hint>
                  <div class="flex justify-between w-full">
                    <span>Max 200 characters</span>
                    <span
                      :class="
                        state.bio?.length > 180
                          ? 'text-orange-500'
                          : 'text-gray-500'
                      "
                    >
                      {{ state.bio?.length || 0 }}/200
                    </span>
                  </div>
                </template>
              </UFormField>
            </div>

            <!-- Action Buttons -->
            <div
              class="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700"
            >
              <UButton
                label="Cancel"
                color="error"
                variant="outline"
                size="lg"
                @click="resetForm"
              />
              <UButton
                type="submit"
                :loading="loading"
                size="lg"
                icon="i-heroicons-check"
                :disabled="!hasChanges"
               
                >Save Changes</UButton>
            </div>
          </UForm>
        </UCard>

        <!-- Additional Info Card -->
        <!-- <UCard>
          <template #header>
            <div class="flex items-center space-x-2">
              <UIcon
                name="i-heroicons-information-circle"
                class="w-6 h-6 text-blue-600 dark:text-blue-400"
              />
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Account Information
              </h2>
            </div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <label
                  class="text-sm font-medium text-gray-500 dark:text-gray-400"
                  >Member since</label
                >
                <p class="text-gray-900 dark:text-white">January 15, 2024</p>
              </div>
              <div>
                <label
                  class="text-sm font-medium text-gray-500 dark:text-gray-400"
                  >Last updated</label
                >
                <p class="text-gray-900 dark:text-white">2 days ago</p>
              </div>
            </div>
            <div class="space-y-4">
              <div>
                <label
                  class="text-sm font-medium text-gray-500 dark:text-gray-400"
                  >Account status</label
                >
                <UBadge color="success" variant="subtle" class="ml-2">
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
                  Verified
                </UBadge>
              </div>
              <div>
                <label
                  class="text-sm font-medium text-gray-500 dark:text-gray-400"
                  >Language</label
                >
                <p class="text-gray-900 dark:text-white">English (US)</p>
              </div>
            </div>
          </div>
        </UCard> -->
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { z } from "zod";

definePageMeta({ layout: "default", middleware: "auth" });
const { $supabase } = useNuxtApp()
const schema = z.object({
  name: z.string().min(1, "Required"),
  full_name: z.string(),
  email: z.string().email("Invalid email").min(1, "Required"),
  email_verified: z.boolean(),
  iss: z.string(),
  phone_verified: z.boolean(),
  avatar_url: z.string().url().optional().nullable(),
  picture: z.string(),
  provider_id: z.string(),
  sub: z.string(),
});

type Schema = z.infer<typeof schema>;

const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

// Refs for file handling
const fileInputRef = ref<HTMLInputElement | null>(null);
const avatarPreview = ref<string | null>(null);
const newAvatarFile = ref<File | null>(null);

// Mock user data
const currentUser = {}

const state = ref<Schema>({
  name: currentUser.name,
  email: currentUser.email,
  picture: currentUser.picture,
  avatar_url: currentUser.avatar_url,
  email_verified:currentUser.email_verified,
  full_name:currentUser.full_name,
  iss:currentUser.iss,
  phone_verified:currentUser.phone_verified,
  provider_id: currentUser.provider_id,
  sub: currentUser.sub
});

// Track original state for change detection
const originalState = ref<Schema>({ ...state.value });

// Computed property to check if form has changes
const hasChanges = computed(() => {
  return JSON.stringify(state.value) !== JSON.stringify(originalState.value);
});

//hooks
onMounted(async()=>{
  const {data: { user },} = await $supabase.auth.getUser();
        if (user) {
            state.value = user.user_metadata
            
        }
})

// methods
const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];

    // Check file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      errorMessage.value = "File size must be less than 2MB";
      input.value = "";
      return;
    }

    newAvatarFile.value = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const removeAvatar = async () => {
  state.value.picture = null;
  avatarPreview.value = null;
  newAvatarFile.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

const resetForm = () => {
  state.value = { ...originalState.value };
  avatarPreview.value = null;
  newAvatarFile.value = null;
  successMessage.value = "";
  errorMessage.value = "";
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

const saveProfile = async () => {
  loading.value = true;
  successMessage.value = "";
  errorMessage.value = "";

  try {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("Saving profile:", state.value);
    if (newAvatarFile.value) {
      console.log("Uploading new avatar:", newAvatarFile.value.name);
      state.value.picture = avatarPreview.value;
    }

    // Update original state after successful save
    originalState.value = { ...state.value };

    avatarPreview.value = null;
    newAvatarFile.value = null;

    successMessage.value = "Profile updated successfully!";
  } catch (error: any) {
    errorMessage.value =
      error.message || "Failed to update profile. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>
