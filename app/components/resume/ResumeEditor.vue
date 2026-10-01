<script setup lang="ts">
import { useSortable, type UseSortableOptions } from '@vueuse/integrations/useSortable'
import type { ResumeDocument, ResumeSectionKey } from '~~/shared/types/resume'
import { createResumeItemId } from '~~/shared/utils/resume'

const model = defineModel<ResumeDocument>({ required: true })
const sortableSections = useTemplateRef<HTMLElement>('sortableSections')
const openSection = ref<'basics' | ResumeSectionKey | null>(null)
const sectionOrder = computed<ResumeSectionKey[]>({
  get: () => model.value.sectionOrder,
  set: value => { model.value.sectionOrder = value }
})

function setSectionOpen(section: 'basics' | ResumeSectionKey, open: boolean) {
  openSection.value = open ? section : openSection.value === section ? null : openSection.value
}

useSortable(() => sortableSections.value, sectionOrder, {
  handle: '.resume-section-drag-handle',
  animation: 200,
  ghostClass: 'opacity-40',
  chosenClass: 'ring-2',
  dragClass: 'shadow-xl'
} as UseSortableOptions)

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= items.length) return
  const [item] = items.splice(index, 1)
  if (item) items.splice(target, 0, item)
}

function addExperience() {
  model.value.experience.push({ id: createResumeItemId(), title: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: '' })
}
function addEducation() {
  model.value.education.push({ id: createResumeItemId(), institution: '', degree: '', field: '', location: '', startDate: '', endDate: '', current: false })
}
function addSkillGroup() {
  model.value.skillGroups.push({ id: createResumeItemId(), name: 'Skills', items: [] })
}
function addProject() {
  model.value.projects.push({ id: createResumeItemId(), name: '', role: '', url: '', startDate: '', endDate: '', bullets: '' })
}
function addCertification() {
  model.value.certifications.push({ id: createResumeItemId(), name: '', issuer: '', issueDate: '', credentialUrl: '' })
}
function addLanguage() {
  model.value.languages.push({ id: createResumeItemId(), name: '', proficiency: '' })
}
function addLink() {
  model.value.links.push({ id: createResumeItemId(), label: '', url: '' })
}
</script>

<template>
  <div class="space-y-6">
    <ResumeSection
      title="Contact and headline"
      description="The information shown at the top of your resume."
      :open="openSection === 'basics'"
      @update:open="setSectionOpen('basics', $event)"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Full name" name="basics.fullName" required>
          <UInput v-model="model.basics.fullName" class="w-full" />
        </UFormField>
        <UFormField label="Professional headline" name="basics.headline">
          <UInput v-model="model.basics.headline" class="w-full" placeholder="Senior Frontend Engineer" />
        </UFormField>
        <UFormField label="Email" name="basics.email">
          <UInput v-model="model.basics.email" type="email" class="w-full" />
        </UFormField>
        <UFormField label="Phone" name="basics.phone">
          <UInput v-model="model.basics.phone" type="tel" class="w-full" />
        </UFormField>
        <UFormField label="Location" name="basics.location" class="sm:col-span-2">
          <UInput v-model="model.basics.location" class="w-full" placeholder="Addis Ababa, Ethiopia" />
        </UFormField>
      </div>
    </ResumeSection>

    <div ref="sortableSections" class="space-y-6">
      <template v-for="section in sectionOrder" :key="section">
    <ResumeSection v-if="section === 'summary'" sortable title="Professional summary" description="Write a concise, role-specific overview of your strengths." :open="openSection === section" @update:open="setSectionOpen(section, $event)">
      <UFormField name="basics.summary" description="Use a concise, role-specific overview of your strengths.">
        <Editor v-model="model.basics.summary" placeholder="Summarize your experience, strengths, and goals…" min-height="9rem" />
      </UFormField>
    </ResumeSection>

    <ResumeSection v-else-if="section === 'experience'" sortable title="Experience" description="Use measurable achievements to show your impact." :open="openSection === section" @update:open="setSectionOpen(section, $event)">
      <p v-if="!model.experience.length" class="rounded-md border border-dashed border-muted p-4 text-sm text-muted">No experience added.</p>
      <div v-for="(item, index) in model.experience" :key="item.id" class="space-y-4 rounded-md bg-elevated/50 p-4">
        <div class="flex items-center justify-between"><span class="text-sm font-medium">Experience {{ index + 1 }}</span><ResumeEntryControls :index="index" :total="model.experience.length" label="experience" @move="moveItem(model.experience, index, $event)" @remove="model.experience.splice(index, 1)" /></div>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Role" :name="`experience.${index}.title`"><UInput v-model="item.title" class="w-full" /></UFormField>
          <UFormField label="Company" :name="`experience.${index}.company`"><UInput v-model="item.company" class="w-full" /></UFormField>
          <UFormField label="Location" :name="`experience.${index}.location`"><UInput v-model="item.location" class="w-full" /></UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Start" :name="`experience.${index}.startDate`"><ResumeDatePicker v-model="item.startDate" /></UFormField>
            <UFormField v-if="!item.current" label="End" :name="`experience.${index}.endDate`"><ResumeDatePicker v-model="item.endDate" /></UFormField>
          </div>
        </div>
        <UCheckbox v-model="item.current" label="I currently work here" @update:model-value="item.endDate = $event === true ? '' : item.endDate" />
        <UFormField label="Achievement bullets" :name="`experience.${index}.bullets`" description="Use bullets, numbering, and emphasis to present measurable results.">
          <Editor v-model="item.bullets" placeholder="Describe your achievements and impact…" min-height="8rem" />
        </UFormField>
      </div>
      <UButton type="button" label="Add experience" icon="i-lucide-plus" size="sm" color="neutral" variant="outline" class="mt-4" @click="addExperience" />
    </ResumeSection>

    <ResumeSection v-else-if="section === 'education'" sortable title="Education" description="Degrees, bootcamps, and relevant programs." :open="openSection === section" @update:open="setSectionOpen(section, $event)">
      <p v-if="!model.education.length" class="rounded-md border border-dashed border-muted p-4 text-sm text-muted">No education added.</p>
      <div v-for="(item, index) in model.education" :key="item.id" class="space-y-4 rounded-md bg-elevated/50 p-4">
        <div class="flex items-center justify-between"><span class="text-sm font-medium">Education {{ index + 1 }}</span><ResumeEntryControls :index="index" :total="model.education.length" label="education" @move="moveItem(model.education, index, $event)" @remove="model.education.splice(index, 1)" /></div>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Institution" :name="`education.${index}.institution`"><UInput v-model="item.institution" class="w-full" /></UFormField>
          <UFormField label="Degree" :name="`education.${index}.degree`"><UInput v-model="item.degree" class="w-full" /></UFormField>
          <UFormField label="Field" :name="`education.${index}.field`"><UInput v-model="item.field" class="w-full" /></UFormField>
          <UFormField label="Location" :name="`education.${index}.location`"><UInput v-model="item.location" class="w-full" /></UFormField>
          <UFormField label="Start" :name="`education.${index}.startDate`"><ResumeDatePicker v-model="item.startDate" /></UFormField>
          <UFormField v-if="!item.current" label="End" :name="`education.${index}.endDate`"><ResumeDatePicker v-model="item.endDate" /></UFormField>
        </div>
        <UCheckbox v-model="item.current" label="Currently studying" @update:model-value="item.endDate = $event === true ? '' : item.endDate" />
      </div>
      <UButton type="button" label="Add education" icon="i-lucide-plus" size="sm" color="neutral" variant="outline" class="mt-4" @click="addEducation" />
    </ResumeSection>

    <ResumeSection v-else-if="section === 'skills'" sortable title="Skills" description="Group related skills for easier scanning." :open="openSection === section" @update:open="setSectionOpen(section, $event)">
      <div v-for="(item, index) in model.skillGroups" :key="item.id" class="space-y-3 rounded-md bg-elevated/50 p-4">
        <div class="flex items-center justify-between"><span class="text-sm font-medium">Skill group {{ index + 1 }}</span><ResumeEntryControls :index="index" :total="model.skillGroups.length" label="skill group" @move="moveItem(model.skillGroups, index, $event)" @remove="model.skillGroups.splice(index, 1)" /></div>
        <UFormField label="Group name" :name="`skillGroups.${index}.name`"><UInput v-model="item.name" class="w-full" placeholder="Technical skills" /></UFormField>
        <UFormField label="Skills" :name="`skillGroups.${index}.items`"><UInputTags v-model="item.items" class="w-full" placeholder="Type a skill and press Enter" /></UFormField>
      </div>
      <UButton type="button" label="Add skill group" icon="i-lucide-plus" size="sm" color="neutral" variant="outline" class="mt-4" @click="addSkillGroup" />
    </ResumeSection>

    <ResumeSection v-else-if="section === 'projects'" sortable title="Projects" description="Show practical work relevant to the target role." :open="openSection === section" @update:open="setSectionOpen(section, $event)">
      <div v-for="(item, index) in model.projects" :key="item.id" class="space-y-4 rounded-md bg-elevated/50 p-4">
        <div class="flex items-center justify-between"><span class="text-sm font-medium">Project {{ index + 1 }}</span><ResumeEntryControls :index="index" :total="model.projects.length" label="project" @move="moveItem(model.projects, index, $event)" @remove="model.projects.splice(index, 1)" /></div>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Name" :name="`projects.${index}.name`"><UInput v-model="item.name" class="w-full" /></UFormField>
          <UFormField label="Your role" :name="`projects.${index}.role`"><UInput v-model="item.role" class="w-full" /></UFormField>
          <UFormField label="URL" :name="`projects.${index}.url`"><UInput v-model="item.url" class="w-full" placeholder="https://" /></UFormField>
          <div class="grid grid-cols-2 gap-3"><UFormField label="Start" :name="`projects.${index}.startDate`"><ResumeDatePicker v-model="item.startDate" /></UFormField><UFormField label="End" :name="`projects.${index}.endDate`"><ResumeDatePicker v-model="item.endDate" /></UFormField></div>
        </div>
        <UFormField label="Highlights" :name="`projects.${index}.bullets`" description="Use bullets, numbering, and emphasis to highlight the work."><Editor v-model="item.bullets" placeholder="Describe the project's outcomes and your contribution…" min-height="7rem" /></UFormField>
      </div>
      <UButton type="button" label="Add project" icon="i-lucide-plus" size="sm" color="neutral" variant="outline" class="mt-4" @click="addProject" />
    </ResumeSection>

    <ResumeSection v-else-if="section === 'certifications'" sortable title="Certifications" description="Licenses and professional credentials." :open="openSection === section" @update:open="setSectionOpen(section, $event)">
      <div v-for="(item, index) in model.certifications" :key="item.id" class="space-y-4 rounded-md bg-elevated/50 p-4">
        <div class="flex items-center justify-between"><span class="text-sm font-medium">Certification {{ index + 1 }}</span><ResumeEntryControls :index="index" :total="model.certifications.length" label="certification" @move="moveItem(model.certifications, index, $event)" @remove="model.certifications.splice(index, 1)" /></div>
        <div class="grid gap-4 sm:grid-cols-2"><UFormField label="Name" :name="`certifications.${index}.name`"><UInput v-model="item.name" class="w-full" /></UFormField><UFormField label="Issuer" :name="`certifications.${index}.issuer`"><UInput v-model="item.issuer" class="w-full" /></UFormField><UFormField label="Issue date" :name="`certifications.${index}.issueDate`"><ResumeDatePicker v-model="item.issueDate" /></UFormField><UFormField label="Credential URL" :name="`certifications.${index}.credentialUrl`"><UInput v-model="item.credentialUrl" class="w-full" placeholder="https://" /></UFormField></div>
      </div>
      <UButton type="button" label="Add certification" icon="i-lucide-plus" size="sm" color="neutral" variant="outline" class="mt-4" @click="addCertification" />
    </ResumeSection>

    <ResumeSection v-else-if="section === 'languages'" sortable title="Languages" description="Languages and proficiency levels." :open="openSection === section" @update:open="setSectionOpen(section, $event)">
      <div v-for="(item, index) in model.languages" :key="item.id" class="grid gap-4 rounded-md bg-elevated/50 p-4 sm:grid-cols-[1fr_1fr_auto]"><UFormField label="Language" :name="`languages.${index}.name`"><UInput v-model="item.name" class="w-full" /></UFormField><UFormField label="Proficiency" :name="`languages.${index}.proficiency`"><UInput v-model="item.proficiency" class="w-full" placeholder="Native, fluent, conversational" /></UFormField><div class="flex items-end"><ResumeEntryControls :index="index" :total="model.languages.length" label="language" @move="moveItem(model.languages, index, $event)" @remove="model.languages.splice(index, 1)" /></div></div>
      <UButton type="button" label="Add language" icon="i-lucide-plus" size="sm" color="neutral" variant="outline" class="mt-4" @click="addLanguage" />
    </ResumeSection>

    <ResumeSection v-else-if="section === 'links'" sortable title="Links" description="Portfolio, GitHub, LinkedIn, and relevant profiles." :open="openSection === section" @update:open="setSectionOpen(section, $event)">
      <div v-for="(item, index) in model.links" :key="item.id" class="grid gap-4 rounded-md bg-elevated/50 p-4 sm:grid-cols-[1fr_1.5fr_auto]"><UFormField label="Label" :name="`links.${index}.label`"><UInput v-model="item.label" class="w-full" /></UFormField><UFormField label="URL" :name="`links.${index}.url`"><UInput v-model="item.url" class="w-full" placeholder="https://" /></UFormField><div class="flex items-end"><ResumeEntryControls :index="index" :total="model.links.length" label="link" @move="moveItem(model.links, index, $event)" @remove="model.links.splice(index, 1)" /></div></div>
      <UButton type="button" label="Add link" icon="i-lucide-plus" size="sm" color="neutral" variant="outline" class="mt-4" @click="addLink" />
    </ResumeSection>
      </template>
    </div>
  </div>
</template>
