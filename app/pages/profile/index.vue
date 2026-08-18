<template>
  <UContainer class="py-8">
    <div class="mb-8 text-center">
      <h1 class="mb-2 text-3xl font-bold text-highlighted">
        Profile Settings
      </h1>
      <p class="text-muted">
        Manage the candidate profile attached to your account.
      </p>
    </div>

    <div class="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="lg:col-span-1">
        <ProfileSidebar active="profile" />
      </div>

      <div class="space-y-6 lg:col-span-2">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-user-round" class="size-6 text-primary" />
              <div>
                <h2 class="text-xl font-semibold text-highlighted">
                  Profile Information
                </h2>
                <p class="mt-1 text-sm text-muted">
                  Update the information employers can use to understand your background.
                </p>
              </div>
            </div>
          </template>

          <UAlert
            v-if="errorMessage"
            icon="i-lucide-triangle-alert"
            color="error"
            variant="subtle"
            :title="errorMessage"
            class="mb-6"
          />

          <div v-if="loadingProfile" class="space-y-4">
            <USkeleton class="h-10 w-full" />
            <USkeleton class="h-24 w-full" />
            <USkeleton class="h-10 w-full" />
            <USkeleton class="h-32 w-full" />
          </div>

          <UForm
            v-else
            :state="state"
            :schema="schema"
            class="space-y-8"
            @submit="saveProfile"
          >
            <section class="flex flex-col gap-5 rounded-lg bg-elevated/50 p-4 sm:flex-row sm:items-center">
              <button
                type="button"
                class="group relative flex size-20 shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Choose profile photo"
                @click="fileInputRef?.click()"
              >
                <UAvatar
                  :src="avatarPreview || existingAvatarUrl || undefined"
                  :alt="state.full_name || 'Profile photo'"
                  :text="avatarInitials"
                  size="3xl"
                  class="ring-4 ring-inverted shadow-md"
                />
                <span class="absolute inset-0 flex items-center justify-center rounded-full bg-inverted/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <UIcon name="i-lucide-camera" class="size-6 text-inverted" />
                </span>
              </button>

              <div class="space-y-3">
                <div>
                  <h3 class="font-medium text-highlighted">
                    Profile Photo
                  </h3>
                  <p class="text-sm text-muted">
                    JPG, GIF, WebP or PNG. Max size 2MB.
                  </p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <UButton
                    label="Upload new photo"
                    color="primary"
                    variant="solid"
                    size="sm"
                    icon="i-lucide-cloud-upload"
                    @click="fileInputRef?.click()"
                  />
                  <UButton
                    label="Remove"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-trash-2"
                    :disabled="!avatarPreview && !existingAvatarUrl"
                    @click="removeAvatar"
                  />
                  <input
                    ref="fileInputRef"
                    type="file"
                    class="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    @change="onFileChange"
                  />
                </div>
              </div>
            </section>

            <section class="space-y-5">
              <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                <UFormField label="Full Name" name="full_name" required>
                  <UInput
                    v-model="state.full_name"
                    placeholder="Your full name"
                    size="lg"
                    icon="i-lucide-user"
                  />
                </UFormField>

                <UFormField label="Email Address" name="email">
                  <UInput
                    v-model="state.email"
                    type="email"
                    disabled
                    size="lg"
                    icon="i-lucide-mail"
                  />
                </UFormField>
              </div>

              <UFormField
                label="Bio"
                name="bio"
                description="A short summary of who you are and what kind of work you want."
              >
                <UTextarea
                  v-model="state.bio"
                 
                  :rows="4"
                  autoresize
                  class="w-full"
                  :maxrows="7"
                  :maxlength="500"
                />
                <template #hint>
                  <span>{{ state.bio.length }}/500</span>
                </template>
              </UFormField>

              <UFormField
                label="Skills"
                name="skills"
                description="Search and select the skills that match your background."
              >
                <UInputMenu
                  v-model="state.skills"
                  :items="skillMenuItems"
                  multiple
                  value-key="value"
                  label-key="label"
                  description-key="description"
                  placeholder="Search skills"
                  size="lg"
                  
                  class="w-full"
                  :search-input="{ placeholder: 'Search skills...' }"
                />
              </UFormField>
            </section>

            <USeparator />

            <section class="space-y-4">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h3 class="text-base font-semibold text-highlighted">
                    Experience
                  </h3>
                  <p class="text-sm text-muted">
                    Add recent roles, internships, or substantial project work.
                  </p>
                </div>
                <UButton
                  label="Add"
                  icon="i-lucide-plus"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  @click="addExperience"
                />
              </div>

              <div
                v-if="!state.experience.length"
                class="rounded-lg border border-dashed border-muted p-4 text-sm text-muted"
              >
                No experience added yet.
              </div>

              <div
                v-for="(item, index) in state.experience"
                :key="`experience-${index}`"
                class="space-y-4 rounded-lg border border-muted p-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <p class="text-sm font-medium text-highlighted">
                    Experience {{ index + 1 }}
                  </p>
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                    aria-label="Remove experience"
                    @click="removeExperience(index)"
                  />
                </div>

	                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
	                  <UFormField :name="`experience.${index}.title`" label="Role">
	                    <UInput v-model="item.title" placeholder="Software Engineer" />
	                  </UFormField>
	                  <UFormField :name="`experience.${index}.company`" label="Company">
	                    <UInput v-model="item.company" placeholder="Company name" />
	                  </UFormField>
	                  <UFormField :name="`experience.${index}.start_date`" label="Start">
	                    <ProfileDatePicker
	                      v-model="item.start_date"
	                      placeholder="Select start date"
	                    />
	                  </UFormField>
	                  <UFormField
	                    v-if="!item.currently_work_here"
	                    :name="`experience.${index}.end_date`"
	                    label="End"
	                  >
	                    <ProfileDatePicker
	                      v-model="item.end_date"
	                      placeholder="Select end date"
	                    />
	                  </UFormField>
	                  <UFormField
	                    :name="`experience.${index}.currently_work_here`"
	                    class="md:col-span-2"
	                  >
	                    <UCheckbox
	                      v-model="item.currently_work_here"
	                      label="I currently work here"
	                      @update:model-value="updateCurrentExperience(item, $event)"
	                    />
	                  </UFormField>
	                </div>

                <UFormField :name="`experience.${index}.description`" label="Description">
                  <UTextarea
                    v-model="item.description"
                    placeholder="What did you build, improve, or own?"
                    :rows="3"
                    class="w-full"
                    autoresize
                    :maxrows="5"
                  />
                </UFormField>
              </div>
            </section>

            <USeparator />

            <section class="space-y-4">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h3 class="text-base font-semibold text-highlighted">
                    Education
                  </h3>
                  <p class="text-sm text-muted">
                    Add degrees, certificates, bootcamps, or relevant programs.
                  </p>
                </div>
                <UButton
                  label="Add"
                  icon="i-lucide-plus"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  @click="addEducation"
                />
              </div>

              <div
                v-if="!state.education.length"
                class="rounded-lg border border-dashed border-muted p-4 text-sm text-muted"
              >
                No education added yet.
              </div>

              <div
                v-for="(item, index) in state.education"
                :key="`education-${index}`"
                class="space-y-4 rounded-lg border border-muted p-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <p class="text-sm font-medium text-highlighted">
                    Education {{ index + 1 }}
                  </p>
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                    aria-label="Remove education"
                    @click="removeEducation(index)"
                  />
                </div>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <UFormField :name="`education.${index}.school`" label="School">
                    <UInput v-model="item.school" placeholder="University or program" />
                  </UFormField>
                  <UFormField :name="`education.${index}.degree`" label="Degree">
                    <UInput v-model="item.degree" placeholder="BSc Computer Science" />
                  </UFormField>
                  <UFormField :name="`education.${index}.field`" label="Field">
                    <UInput v-model="item.field" placeholder="Software Engineering" />
                  </UFormField>
                  <UFormField
                    v-if="!item.not_graduated_yet"
                    :name="`education.${index}.year`"
                    label="Graduation Year"
                  >
                    <ProfileDatePicker
                      v-model="item.year"
                      placeholder="Select graduation year"
                      output="year"
                    />
                  </UFormField>
                  <UFormField
                    :name="`education.${index}.not_graduated_yet`"
                    class="md:col-span-2"
                  >
                    <UCheckbox
                      v-model="item.not_graduated_yet"
                      label="I have not graduated yet"
                      @update:model-value="updateNotGraduatedYet(item, $event)"
                    />
                  </UFormField>
                </div>
              </div>
            </section>

            <USeparator />

            <section class="space-y-5">
              <div>
                <h3 class="text-base font-semibold text-highlighted">
                  Links
                </h3>
                <p class="text-sm text-muted">
                  Add the links you want attached to your candidate profile.
                </p>
              </div>

              <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                <UFormField label="GitHub" name="github_url">
                  <UInput
                    v-model="state.github_url"
                    placeholder="https://github.com/username"
                    icon="i-lucide-github"
                  />
                </UFormField>

                <UFormField label="LinkedIn" name="linkedin_url">
                  <UInput
                    v-model="state.linkedin_url"
                    placeholder="https://linkedin.com/in/username"
                    icon="i-lucide-linkedin"
                  />
                </UFormField>
              </div>

              <UFormField
                label="CV"
                name="cv_file_name"
                description="Upload a PDF resume. Max size 10MB."
              >
                <div class="space-y-3 rounded-lg border border-muted p-4">
                  <div
                    v-if="state.cv_file_name"
                    class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div class="flex min-w-0 items-center gap-3">
                      <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <UIcon name="i-lucide-file-text" class="size-5" />
                      </div>
                      <div class="min-w-0">
                        <p class="truncate text-sm font-medium text-highlighted">
                          {{ state.cv_file_name }}
                        </p>
                        <p class="text-xs text-muted">
                          {{ selectedCvFile ? 'Ready to upload when you save.' : 'Stored privately in your account.' }}
                        </p>
                      </div>
                    </div>

                    <div class="flex flex-wrap gap-2">
                      <UButton
                        v-if="selectedCvFile || state.cv_file_path"
                        label="View"
                        icon="i-lucide-external-link"
                        color="neutral"
                        variant="outline"
                        size="sm"
                        :loading="openingCv"
                        @click="openCv"
                      />
                      <UButton
                        label="Remove"
                        icon="i-lucide-trash-2"
                        color="error"
                        variant="ghost"
                        size="sm"
                        @click="removeCv"
                      />
                    </div>
                  </div>

                  <div
                    v-else
                    class="rounded-md border border-dashed border-muted p-4 text-sm text-muted"
                  >
                    No CV uploaded yet.
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <UButton
                      :label="state.cv_file_name ? 'Replace CV' : 'Upload CV'"
                      icon="i-lucide-cloud-upload"
                      color="neutral"
                      variant="outline"
                      size="sm"
                      @click="cvInputRef?.click()"
                    />
                    <input
                      ref="cvInputRef"
                      type="file"
                      class="hidden"
                      accept="application/pdf"
                      @change="onCvFileChange"
                    />
                  </div>
                </div>
              </UFormField>

            </section>

            <section class="space-y-4">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h3 class="text-base font-semibold text-highlighted">
                    Portfolio Links
                  </h3>
                  <p class="text-sm text-muted">
                    Add projects, case studies, writing, or personal websites.
                  </p>
                </div>
                <UButton
                  label="Add"
                  icon="i-lucide-plus"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  @click="addPortfolioLink"
                />
              </div>

              <div
                v-if="!state.portfolio_links.length"
                class="rounded-lg border border-dashed border-muted p-4 text-sm text-muted"
              >
                No portfolio links added yet.
              </div>

              <div
                v-for="(item, index) in state.portfolio_links"
                :key="`portfolio-${index}`"
                class="grid grid-cols-1 gap-4 rounded-lg border border-muted p-4 md:grid-cols-[1fr_1.5fr_auto]"
              >
                <UFormField :name="`portfolio_links.${index}.label`" label="Label">
                  <UInput v-model="item.label" placeholder="Portfolio" />
                </UFormField>
                <UFormField :name="`portfolio_links.${index}.url`" label="URL">
                  <UInput v-model="item.url" placeholder="https://example.com" />
                </UFormField>
                <div class="flex items-end">
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    aria-label="Remove portfolio link"
                    @click="removePortfolioLink(index)"
                  />
                </div>
              </div>
            </section>

            <div class="flex flex-col-reverse justify-end gap-3 border-t border-muted pt-6 sm:flex-row">
              <UButton
                label="Cancel"
                color="neutral"
                variant="outline"
                size="lg"
                :disabled="saving"
                @click="resetForm"
              />
              <UButton
                type="submit"
                label="Save Changes"
                :loading="saving"
                size="lg"
                icon="i-lucide-check"
                :disabled="!hasChanges"
              />
            </div>
          </UForm>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import techSkillsData from '~/data/tech-skills.json'

definePageMeta({ layout: 'default', middleware: 'auth' })

type ExperienceItem = {
  title: string
  company: string
  start_date: string
  end_date: string
  currently_work_here: boolean
  description: string
}

type EducationItem = {
  school: string
  degree: string
  field: string
  year: string
  not_graduated_yet: boolean
}

type PortfolioLink = {
  label: string
  url: string
}

type SkillGroup = {
  category: string
  skills: string[]
}

type SkillMenuItem =
  | { type: 'label', label: string }
  | { label: string, value: string, description: string }

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => !value || /^https?:\/\/\S+\.\S+/.test(value), 'Enter a valid URL starting with http:// or https://')

const schema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required'),
  email: z.email('Invalid email'),
  bio: z.string().max(500, 'Bio must be 500 characters or less'),
  skills: z.array(z.string()),
  github_url: optionalUrl,
  linkedin_url: optionalUrl,
  avatar_file_path: z.string(),
  avatar_file_name: z.string(),
  cv_file_path: z.string(),
  cv_file_name: z.string(),
  experience: z.array(z.object({
    title: z.string(),
    company: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    currently_work_here: z.boolean().default(false),
    description: z.string()
  })),
  education: z.array(z.object({
    school: z.string(),
    degree: z.string(),
    field: z.string(),
    year: z.string(),
    not_graduated_yet: z.boolean().default(false)
  })),
  portfolio_links: z.array(z.object({
    label: z.string(),
    url: optionalUrl
  }))
})

type ProfileForm = z.output<typeof schema>

const { $supabase } = useNuxtApp()
const toast = useToast()

const loadingProfile = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const currentUserId = ref('')

const state = reactive<ProfileForm>({
  full_name: '',
  email: '',
  bio: '',
  skills: [],
  github_url: '',
  linkedin_url: '',
  avatar_file_path: '',
  avatar_file_name: '',
  cv_file_path: '',
  cv_file_name: '',
  experience: [],
  education: [],
  portfolio_links: []
})

const originalState = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const cvInputRef = ref<HTMLInputElement | null>(null)
const avatarPreview = ref<string | null>(null)
const newAvatarFile = ref<File | null>(null)
const existingAvatarUrl = ref('')
const existingAvatarPath = ref('')
const avatarRemoved = ref(false)
const selectedCvFile = ref<File | null>(null)
const existingCvPath = ref('')
const cvRemoved = ref(false)
const openingCv = ref(false)
const AVATAR_BUCKET = 'profile-images'
const CV_BUCKET = 'profile-documents'
const AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const CV_MIME_TYPE = 'application/pdf'
const MAX_AVATAR_SIZE = 2 * 1024 * 1024
const MAX_CV_SIZE = 10 * 1024 * 1024

const skillMenuItems = computed<SkillMenuItem[][]>(() =>
  (techSkillsData as SkillGroup[]).map((group) => [
    { type: 'label', label: group.category },
    ...group.skills.map((skill) => ({
      label: skill,
      value: skill,
      description: group.category
    }))
  ])
)
const hasPendingAvatarChange = computed(() => !!newAvatarFile.value || avatarRemoved.value)
const hasPendingCvChange = computed(() => !!selectedCvFile.value || cvRemoved.value)
const hasChanges = computed(() =>
  serializeState(state) !== originalState.value ||
  hasPendingAvatarChange.value ||
  hasPendingCvChange.value
)
const avatarInitials = computed(() => {
  const name = state.full_name.trim()

  if (!name) return 'S'

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
})

onMounted(async () => {
  await fetchProfile()
})

async function fetchProfile() {
  loadingProfile.value = true
  errorMessage.value = ''

  try {
    const {
      data: { user },
      error: userError
    } = await $supabase.auth.getUser()

    if (userError) throw userError
    if (!user) return navigateTo('/auth/signin')

    currentUserId.value = user.id
    state.email = user.email || ''

    const { data, error } = await $supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error) throw error

    const metadata = user.user_metadata || {}
    applyProfileToState({
      full_name: data?.full_name || metadata.full_name || metadata.name || '',
      bio: data?.bio || '',
      skills: data?.skills || [],
      experience: data?.experience || [],
      education: data?.education || [],
      portfolio_links: data?.portfolio_links || [],
      github_url: data?.github_url || '',
      linkedin_url: data?.linkedin_url || '',
      avatar_file_path: data?.avatar_file_path || '',
      avatar_file_name: data?.avatar_file_name || '',
      avatar_display_url: data?.avatar_file_path
        ? await createAvatarSignedUrl(data.avatar_file_path)
        : metadata.avatar_url || metadata.picture || '',
      cv_file_path: data?.cv_file_path || '',
      cv_file_name: data?.cv_file_name || '',
    })

    originalState.value = serializeState(state)
  } catch (error: any) {
    errorMessage.value = error.message || 'Could not load your profile.'
  } finally {
    loadingProfile.value = false
  }
}

async function saveProfile(event: FormSubmitEvent<ProfileForm>) {
  if (!currentUserId.value) return

  saving.value = true
  errorMessage.value = ''

  try {
    const formWithAvatar = await resolveAvatarForSave(event.data)
    const formWithFiles = await resolveCvForSave(formWithAvatar)
    const profile = buildProfilePayload(formWithFiles)

    const { error } = await $supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })

    if (error) throw error

    const metadataUpdates: Record<string, string | null> = {
      full_name: event.data.full_name.trim(),
      name: event.data.full_name.trim()
    }

    if (avatarRemoved.value || newAvatarFile.value) {
      metadataUpdates.avatar_url = null
      metadataUpdates.picture = null
    }

    const { error: metadataError } = await $supabase.auth.updateUser({
      data: metadataUpdates
    })

    if (metadataError) throw metadataError

    const savedAvatarPreview = !!newAvatarFile.value
    const savedCvFile = !!selectedCvFile.value
    const removedCvFile = cvRemoved.value
    const previousAvatarPath = existingAvatarPath.value
    const previousCvPath = existingCvPath.value
    state.avatar_file_path = formWithFiles.avatar_file_path
    state.avatar_file_name = formWithFiles.avatar_file_name
    state.cv_file_path = formWithFiles.cv_file_path
    state.cv_file_name = formWithFiles.cv_file_name
    await removePreviousAvatarIfNeeded(previousAvatarPath, state.avatar_file_path)
    await removePreviousCvIfNeeded(previousCvPath, state.cv_file_path)
    existingAvatarPath.value = state.avatar_file_path
    existingAvatarUrl.value = state.avatar_file_path
      ? await createAvatarSignedUrl(state.avatar_file_path)
      : ''
    selectedCvFile.value = null
    cvRemoved.value = false
    existingCvPath.value = state.cv_file_path
    avatarPreview.value = null
    newAvatarFile.value = null
    avatarRemoved.value = false
    originalState.value = serializeState(state)
    toast.add({
      title: 'Profile saved',
      description: savedCvFile
        ? 'Your CV was uploaded and your profile has been updated.'
        : removedCvFile
          ? 'Your CV was removed and your profile has been updated.'
          : savedAvatarPreview
            ? 'Your photo was uploaded and your profile has been updated.'
            : 'Your profile information has been updated.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to update profile. Please try again.'
    toast.add({
      title: 'Could not save profile',
      description: errorMessage.value,
      color: 'error',
      icon: 'i-lucide-triangle-alert'
    })
  } finally {
    saving.value = false
  }
}

function buildProfilePayload(form: ProfileForm) {
  return {
    id: currentUserId.value,
    full_name: form.full_name.trim(),
    bio: form.bio.trim(),
    skills: normalizeSkills(form.skills),
    experience: cleanExperience(form.experience),
    education: cleanEducation(form.education),
    portfolio_links: cleanPortfolioLinks(form.portfolio_links),
    github_url: nullIfBlank(form.github_url),
    linkedin_url: nullIfBlank(form.linkedin_url),
    avatar_file_path: nullIfBlank(form.avatar_file_path),
    avatar_file_name: nullIfBlank(form.avatar_file_name),
    cv_file_path: nullIfBlank(form.cv_file_path),
    cv_file_name: nullIfBlank(form.cv_file_name),
    updated_at: new Date().toISOString()
  }
}

function applyProfileToState(profile: {
  full_name: string
  bio: string
  skills: string[]
  experience: ExperienceItem[]
  education: EducationItem[]
  portfolio_links: PortfolioLink[]
  github_url: string
  linkedin_url: string
  avatar_file_path: string
  avatar_file_name: string
  avatar_display_url: string
  cv_file_path: string
  cv_file_name: string
}) {
  state.full_name = profile.full_name
  state.bio = profile.bio
  state.skills = normalizeSkills(profile.skills)
  state.github_url = profile.github_url || ''
  state.linkedin_url = profile.linkedin_url || ''
  state.avatar_file_path = profile.avatar_file_path || ''
  state.avatar_file_name = profile.avatar_file_name || ''
  existingAvatarPath.value = profile.avatar_file_path || ''
  state.cv_file_path = profile.cv_file_path || ''
  state.cv_file_name = profile.cv_file_name || ''
  existingCvPath.value = profile.cv_file_path || ''
  selectedCvFile.value = null
  cvRemoved.value = false
  if (cvInputRef.value) {
    cvInputRef.value.value = ''
  }
  existingAvatarUrl.value = profile.avatar_display_url || ''
  avatarPreview.value = null
  newAvatarFile.value = null
  avatarRemoved.value = false
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  state.experience = normalizeExperience(profile.experience)
  state.education = normalizeEducation(profile.education)
  state.portfolio_links = normalizePortfolioLinks(profile.portfolio_links)
}

function resetForm() {
  try {
    applyProfileToState(JSON.parse(originalState.value))
    errorMessage.value = ''
  } catch {
    fetchProfile()
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  if (!AVATAR_MIME_TYPES.includes(file.type)) {
    errorMessage.value = 'Profile photo must be JPG, GIF, WebP or PNG.'
    input.value = ''
    toast.add({
      title: 'Invalid photo file',
      description: errorMessage.value,
      color: 'error',
      icon: 'i-lucide-triangle-alert'
    })
    return
  }

  if (file.size > MAX_AVATAR_SIZE) {
    errorMessage.value = 'File size must be less than 2MB.'
    input.value = ''
    toast.add({
      title: 'Photo is too large',
      description: errorMessage.value,
      color: 'error',
      icon: 'i-lucide-triangle-alert'
    })
    return
  }

  errorMessage.value = ''
  newAvatarFile.value = file
  avatarRemoved.value = false

  const reader = new FileReader()
  reader.onload = (readerEvent) => {
    avatarPreview.value = readerEvent.target?.result as string
  }
  reader.readAsDataURL(file)
}

function removeAvatar() {
  avatarPreview.value = null
  newAvatarFile.value = null
  avatarRemoved.value = !!state.avatar_file_path || !!existingAvatarPath.value || !!existingAvatarUrl.value
  state.avatar_file_path = ''
  state.avatar_file_name = ''
  existingAvatarUrl.value = ''

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

async function resolveAvatarForSave(form: ProfileForm): Promise<ProfileForm> {
  if (avatarRemoved.value) {
    return {
      ...form,
      avatar_file_path: '',
      avatar_file_name: ''
    }
  }

  if (!newAvatarFile.value) {
    return form
  }

  const extension = newAvatarFile.value.name.split('.').pop()?.toLowerCase() || 'jpg'
  const avatarPath = `${currentUserId.value}/avatar/${Date.now()}-${sanitizeFileName(`profile.${extension}`)}`
  const { error } = await $supabase.storage
    .from(AVATAR_BUCKET)
    .upload(avatarPath, newAvatarFile.value, {
      contentType: newAvatarFile.value.type,
      upsert: false
    })

  if (error) throw error

  return {
    ...form,
    avatar_file_path: avatarPath,
    avatar_file_name: newAvatarFile.value.name
  }
}

async function createAvatarSignedUrl(path: string) {
  const { data, error } = await $supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, 60 * 60)

  if (error) return ''

  return data?.signedUrl || ''
}

async function removePreviousAvatarIfNeeded(previousPath: string, nextPath: string) {
  if (!previousPath || previousPath === nextPath) return
  if (!newAvatarFile.value && !avatarRemoved.value) return

  const { error } = await $supabase.storage
    .from(AVATAR_BUCKET)
    .remove([previousPath])

  if (error) {
    toast.add({
      title: 'Old photo was not removed',
      description: 'Your profile was saved, but the previous photo file may still need cleanup later.',
      color: 'warning',
      icon: 'i-lucide-info'
    })
  }
}

function onCvFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  if ((file.type && file.type !== CV_MIME_TYPE) || !file.name.toLowerCase().endsWith('.pdf')) {
    errorMessage.value = 'CV must be a PDF file.'
    input.value = ''
    toast.add({
      title: 'Invalid CV file',
      description: errorMessage.value,
      color: 'error',
      icon: 'i-lucide-triangle-alert'
    })
    return
  }

  if (file.size > MAX_CV_SIZE) {
    errorMessage.value = 'CV must be 10MB or smaller.'
    input.value = ''
    toast.add({
      title: 'CV is too large',
      description: errorMessage.value,
      color: 'error',
      icon: 'i-lucide-triangle-alert'
    })
    return
  }

  errorMessage.value = ''
  selectedCvFile.value = file
  cvRemoved.value = false
  state.cv_file_name = file.name
}

function removeCv() {
  selectedCvFile.value = null
  cvRemoved.value = !!state.cv_file_path || !!existingCvPath.value
  state.cv_file_path = ''
  state.cv_file_name = ''

  if (cvInputRef.value) {
    cvInputRef.value.value = ''
  }
}

async function openCv() {
  if (selectedCvFile.value) {
    const url = URL.createObjectURL(selectedCvFile.value)
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    return
  }

  if (!state.cv_file_path) return

  openingCv.value = true

  try {
    const { data, error } = await $supabase.storage
      .from(CV_BUCKET)
      .createSignedUrl(state.cv_file_path, 60)

    if (error) throw error
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    }
  } catch (error: any) {
    toast.add({
      title: 'Could not open CV',
      description: error.message || 'Please try again.',
      color: 'error',
      icon: 'i-lucide-triangle-alert'
    })
  } finally {
    openingCv.value = false
  }
}

async function resolveCvForSave(form: ProfileForm): Promise<ProfileForm> {
  if (cvRemoved.value) {
    return {
      ...form,
      cv_file_path: '',
      cv_file_name: ''
    }
  }

  if (!selectedCvFile.value) {
    return form
  }

  const cvPath = `${currentUserId.value}/cv/${Date.now()}-${sanitizeFileName(selectedCvFile.value.name)}`
  const { error } = await $supabase.storage
    .from(CV_BUCKET)
    .upload(cvPath, selectedCvFile.value, {
      contentType: CV_MIME_TYPE,
      upsert: false
    })

  if (error) throw error

  return {
    ...form,
    cv_file_path: cvPath,
    cv_file_name: selectedCvFile.value.name
  }
}

async function removePreviousCvIfNeeded(previousPath: string, nextPath: string) {
  if (!previousPath || previousPath === nextPath) return
  if (!selectedCvFile.value && !cvRemoved.value) return

  const { error } = await $supabase.storage
    .from(CV_BUCKET)
    .remove([previousPath])

  if (error) {
    toast.add({
      title: 'Old CV was not removed',
      description: 'Your profile was saved, but the previous CV file may still need cleanup later.',
      color: 'warning',
      icon: 'i-lucide-info'
    })
  }
}

function addExperience() {
  state.experience.push({
    title: '',
    company: '',
    start_date: '',
    end_date: '',
    currently_work_here: false,
    description: ''
  })
}

function updateCurrentExperience(item: ExperienceItem, value: boolean | 'indeterminate') {
  item.currently_work_here = value === true
  item.end_date = item.currently_work_here ? 'Present' : ''
}

function removeExperience(index: number) {
  state.experience.splice(index, 1)
}

function addEducation() {
  state.education.push({
    school: '',
    degree: '',
    field: '',
    year: '',
    not_graduated_yet: false
  })
}

function updateNotGraduatedYet(item: EducationItem, value: boolean | 'indeterminate') {
  item.not_graduated_yet = value === true
  item.year = item.not_graduated_yet ? 'Not graduated yet' : ''
}

function removeEducation(index: number) {
  state.education.splice(index, 1)
}

function addPortfolioLink() {
  state.portfolio_links.push({
    label: '',
    url: ''
  })
}

function removePortfolioLink(index: number) {
  state.portfolio_links.splice(index, 1)
}

function serializeState(form: ProfileForm) {
  return JSON.stringify({
    full_name: form.full_name,
    bio: form.bio,
    skills: normalizeSkills(form.skills),
    github_url: form.github_url,
    linkedin_url: form.linkedin_url,
    avatar_file_path: form.avatar_file_path,
    avatar_file_name: form.avatar_file_name,
    cv_file_path: form.cv_file_path,
    cv_file_name: form.cv_file_name,
    existing_avatar_url: existingAvatarUrl.value,
    experience: cleanExperience(form.experience),
    education: cleanEducation(form.education),
    portfolio_links: cleanPortfolioLinks(form.portfolio_links)
  })
}

function normalizeSkills(skills: string[] = []) {
  return Array.from(new Set(
    skills
      .filter((skill) => typeof skill === 'string')
      .map((skill) => skill.trim())
      .filter(Boolean)
  ))
}

function normalizeExperience(items: ExperienceItem[] = []) {
  return items.map((item) => {
    const currentlyWorksHere = Boolean(item?.currently_work_here) || item?.end_date === 'Present'

    return {
      title: item?.title || '',
      company: item?.company || '',
      start_date: item?.start_date || '',
      end_date: currentlyWorksHere ? 'Present' : item?.end_date || '',
      currently_work_here: currentlyWorksHere,
      description: item?.description || ''
    }
  })
}

function cleanExperience(items: ExperienceItem[] = []) {
  return normalizeExperience(items).filter((item) =>
    [
      item.title,
      item.company,
      item.start_date,
      item.description,
      item.currently_work_here ? '' : item.end_date
    ].some(Boolean)
  )
}

function normalizeEducation(items: EducationItem[] = []) {
  return items.map((item) => {
    const notGraduatedYet = Boolean(item?.not_graduated_yet) || item?.year === 'Not graduated yet'

    return {
      school: item?.school || '',
      degree: item?.degree || '',
      field: item?.field || '',
      year: notGraduatedYet ? 'Not graduated yet' : item?.year || '',
      not_graduated_yet: notGraduatedYet
    }
  })
}

function cleanEducation(items: EducationItem[] = []) {
  return normalizeEducation(items).filter((item) =>
    [
      item.school,
      item.degree,
      item.field,
      item.not_graduated_yet ? '' : item.year
    ].some(Boolean)
  )
}

function normalizePortfolioLinks(items: PortfolioLink[] = []) {
  return items.map((item) => ({
    label: item?.label || '',
    url: item?.url || ''
  }))
}

function cleanPortfolioLinks(items: PortfolioLink[] = []) {
  return normalizePortfolioLinks(items).filter((item) => item.label || item.url)
}

function nullIfBlank(value: string) {
  const trimmed = value?.trim()

  return trimmed ? trimmed : null
}

function sanitizeFileName(fileName: string) {
  const fallbackName = 'cv.pdf'
  const sanitized = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return sanitized || fallbackName
}
</script>
