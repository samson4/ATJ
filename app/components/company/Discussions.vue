<template>
  <div class="space-y-6">
    <!-- Discussions Header -->
    <div class="border-b border-gray-200 dark:border-gray-700 pb-4">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Discussions</h2>
      <p class="text-gray-600 dark:text-gray-300 mt-1">
        Ask questions and share insights about {{ company.name }}
      </p>
    </div>

    <!-- Ask Question Form -->
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Ask a Question</h3>
      </template>

      <div class="flex items-start gap-3">
        <UAvatar 
          :src="currentUser?.user_metadata.avatar_url || '/default-avatar.png'" 
          :alt="currentUser?.user_metadata.full_name || 'User'" 
          size="md" 
        />
        <div class="flex-1 space-y-3">
          <UTextarea 
            v-model="newQuestion"
            placeholder="What would you like to know about this company?"
            :rows="3"
            :maxlength="500"
            class="w-full"
          />
          
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ newQuestion.length }}/500 characters
            </span>
            <UButton 
              :disabled="!newQuestion.trim() || newQuestion.length > 500"
              @click="submitQuestion"
            >
              Post Question
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Discussions List -->
    <div class="space-y-4">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <UCard v-for="n in 3" :key="n">
          <div class="flex gap-3">
            <USkeleton class="h-10 w-10 rounded-full" />
            <div class="flex-1 space-y-2">
              <div class="flex justify-between">
                <USkeleton class="h-4 w-32" />
                <USkeleton class="h-4 w-16" />
              </div>
              <USkeleton class="h-4 w-full" />
              <USkeleton class="h-4 w-3/4" />
              <div class="flex gap-4 mt-3">
                <USkeleton class="h-4 w-20" />
                <USkeleton class="h-4 w-20" />
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Empty State -->
      <UCard v-else-if="discussions.length === 0">
        <div class="text-center py-8">
          <UIcon name="i-heroicons-chat-bubble-left-right" class="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto" />
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No discussions yet</h3>
          <p class="mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Be the first to ask a question about {{ company?.name }}
          </p>
        </div>
      </UCard>

      <!-- Discussions -->
      <div v-else class="space-y-4">
        <UCard 
          v-for="discussion in discussions" 
          :key="discussion.id"
        >
          <template #header>
            <div class="flex justify-between items-start">
              <div class="flex items-center gap-3">
                <UAvatar 
                  :src="discussion.avatar_url || '/default-avatar.png'" 
                  :alt="discussion.user_name" 
                  size="md" 
                />
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white">{{ discussion.full_name ? discussion.full_name : discussion.user_email }}</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(discussion.created_at) }}
                  </p>
                </div>
              </div>
              
              <div class="flex items-center gap-2">
                <UButton
                 v-if="currentUser?.id === discussion.user_id"
                  color="primary" 
                  variant="ghost" 
                  icon="i-heroicons-pencil"
                  size="xs"
                  @click="editQuestion(discussion.id)"
                />
                <UButton 
                  v-if="currentUser?.id === discussion.user_id"
                  color="neutral" 
                  variant="ghost" 
                  icon="i-heroicons-trash"
                  size="xs"
                  @click="openModal(discussion.id)"
                />
              </div>
            </div>
          </template>
          
          
          <div v-if="editingDiscussionId === discussion.id">
            <UTextarea 
              v-model="discussion.content"
              :rows="3"
              class="w-full mt-2"
            />
            <div class="flex justify-end mt-2">
              <UButton 
                size="sm" 
                color="primary" 
                @click="saveEditedQuestion(discussion.id, discussion.content)"
              >
                Save
              </UButton>
              <UButton 
                size="sm" 
                variant="outline" 
                class="ml-2" 
                @click="editingDiscussionId = null"
              >
                Cancel
              </UButton>
            </div>
          </div>
          <p v-else class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ discussion.content }}</p>

          <!-- Answers Section -->
          <!-- <div v-if="discussion.answers && discussion.answers.length > 0" class="mt-4 space-y-3">
            <USeparator label="Answers" />
            
            <UCard 
              v-for="answer in discussion.answers" 
              :key="answer.id"
              class="bg-gray-50 dark:bg-gray-800/50"
            >
              <div class="flex gap-3">
                <UAvatar 
                  :src="answer.user_avatar || '/default-avatar.png'" 
                  :alt="answer.user_name" 
                  size="sm" 
                />
                <div class="flex-1">
                  <div class="flex justify-between items-center mb-1">
                    <h5 class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ answer.user_name }}
                    </h5>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDate(answer.created_at) }}
                    </p>
                  </div>
                  <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {{ answer.content }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>

           Answer Form
          <template #footer>
            <div class="flex gap-3">
              <UAvatar 
                :src="currentUser?.avatar || '/default-avatar.png'" 
                :alt="currentUser?.name || 'User'" 
                size="sm" 
              />
              <div class="flex-1 space-y-2">
                <UTextarea 
                  v-model="discussion.newAnswer"
                  placeholder="Write your answer..."
                  :rows="2"
                  class="w-full"
                />
                <div class="flex justify-end">
                  <UButton 
                    :disabled="!discussion.newAnswer?.trim()"
                    size="sm"
                    @click="submitAnswer(discussion.id, discussion.newAnswer)"
                  >
                    Post Answer
                  </UButton>
                </div>
              </div>
            </div>
          </template> -->
        </UCard>
           <div class="flex justify-center my-4">
      <UPagination
    v-model:page="page"
    :items-per-page="itemsPerPage"
    active-color="primary"
    :total="totalDiscussions"
  />
  </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $supabase } = useNuxtApp()
const route = useRoute()
import { useAuthStore } from "~/stores/auth"
import DisplayConfirmation from '~/components/display/Confirmation.vue'
// Props
const props = defineProps<{
  company: any
}>()

const overlay = useOverlay()
const toast = useToast()


async function openModal(discussionId: string) {
 const modal = overlay.create(DisplayConfirmation)
  const instance = modal.open({
    onConfirm: async () => {
      await deleteQuestion(discussionId)
      modal.close()
    }
  })
}
// State
const company = props.company
const discussions = ref<any[]>([])
const newQuestion = ref('')
const loading = ref(true)
const authStore = useAuthStore()
const currentUser = ref(authStore.authenticated_user)
const page = ref(1)
const itemsPerPage = ref(50)
const totalDiscussions = ref(0)
const editingDiscussionId = ref<string | null>(null)
// Fetch discussions
const fetchDiscussions = async () => {
  const from = (page.value - 1) * itemsPerPage.value
    const to = page.value * itemsPerPage.value - 1
  try {
    loading.value = true
    const { data, error, count } = await $supabase
      .schema("companies")
      .from('discussions_with_user_info')
      .select(`*`, { count: 'exact' })
      .eq('company_id', route.params.id)
      .order('created_at', { ascending: false })
      .range(from, to)
    if (error) throw error

    // Transform data to include user info and newAnswer field
    discussions.value = data
    totalDiscussions.value = typeof count === 'number' ? count : (data || []).length
  } catch (error) {
    console.error('Error fetching discussions:', error)
    
  } finally {
    loading.value = false
  }
}

// Submit a new question
const submitQuestion = async () => {
  if (!newQuestion.value.trim()) return

  try {
    const { data, error } = await $supabase
      .schema("companies")
      .from('discussions')
      .insert({
        company_id: route.params.id,
        user_id: currentUser.value.id,
        content: newQuestion.value.trim()
      })

    if (error) throw error

    // Reset form and refresh discussions
    newQuestion.value = ''
    await fetchDiscussions()
  } catch (error) {
    console.error('Error submitting question:', error)
  }
}

// Submit an answer
const submitAnswer = async (discussionId: string, answerContent: string) => {
  if (!answerContent.trim()) return

  try {
    const { data, error } = await $supabase
      .schema("companies")
      .from('answers')
      .insert({
        discussion_id: discussionId,
        user_id: currentUser.value.id,
        content: answerContent.trim(),
        created_at: new Date().toISOString()
      })

    if (error) throw error

    // Reset form and refresh discussions
    await fetchDiscussions()
  } catch (error) {
    console.error('Error submitting answer:', error)
  }
}

//edit a question
const editQuestion = async (discussionId: string) => {
  editingDiscussionId.value = discussionId
}
const saveEditedQuestion = async (discussionId: string, updatedContent: string) => {
  try {
    const { error } = await $supabase
      .schema("companies")
      .from('discussions')
      .update({ content: updatedContent })
      .eq('id', discussionId)

    if (error) throw error
    editingDiscussionId.value = null
    newQuestion.value = ''
    await fetchDiscussions()
  } catch (error) {
    console.error('Error deleting question:', error)
  }
}

// Delete a question
const deleteQuestion = async (discussionId: string) => {
 

  try {
    const { error } = await $supabase
      .schema("companies")
      .from('discussions')
      .delete()
      .eq('id', discussionId)

    if (error) throw error
    toast.add({
      title: 'Question deleted successfully.',
      icon: 'i-heroicons-trash',
      color: 'success'
    })
    await fetchDiscussions()
  } catch (error) {
    toast.add({
      title: 'Error deleting question.',
      icon: 'i-heroicons-trash',
      color: 'error'
    })
    console.error('Error deleting question:', error)
  }
}

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Fetch discussions on component mount
onMounted(() => {
  fetchDiscussions()
})

watch([page, itemsPerPage], () => {
  fetchDiscussions()
})
</script>