import { defineStore } from 'pinia'

type JobRecord = {
  id?: string
  saved_job_id?: string
  saved_at?: string
  application_id?: string
  applied_at?: string
  tracked_at?: string
  [key: string]: any
}

type JobState = {
  selectedJob: JobRecord
  jobList: JobRecord[]
  savedJobIds: string[]
  savedJobs: JobRecord[]
  loadingSavedJobIds: boolean
  loadingSavedJobs: boolean
  savingJobIds: string[]
  appliedJobIds: string[]
  appliedJobs: JobRecord[]
  loadingAppliedJobIds: boolean
  loadingAppliedJobs: boolean
  applyingJobIds: string[]
  removingAppliedJobIds: string[]
}


export const useJobStore = defineStore('job', {
  state: (): JobState => ({
    selectedJob: {},
    jobList: [],
    savedJobIds: [],
    savedJobs: [],
    loadingSavedJobIds: false,
    loadingSavedJobs: false,
    savingJobIds: [],
    appliedJobIds: [],
    appliedJobs: [],
    loadingAppliedJobIds: false,
    loadingAppliedJobs: false,
    applyingJobIds: [],
    removingAppliedJobIds: []
  }),
  getters: {
    isJobSaved: (state) => {
      return (jobId?: string) => !!jobId && state.savedJobIds.includes(jobId)
    },
    isSavingJob: (state) => {
      return (jobId?: string) => !!jobId && state.savingJobIds.includes(jobId)
    },
    isJobApplied: (state) => {
      return (jobId?: string) => !!jobId && state.appliedJobIds.includes(jobId)
    },
    isApplyingJob: (state) => {
      return (jobId?: string) => !!jobId && state.applyingJobIds.includes(jobId)
    },
    isRemovingAppliedJob: (state) => {
      return (jobId?: string) => !!jobId && state.removingAppliedJobIds.includes(jobId)
    }
  },
  actions: {
    async getCurrentUser() {
      const { $supabase } = useNuxtApp()
      const { data: { user } } = await $supabase.auth.getUser()

      return user
    },
    clearSavedJobs() {
      this.savedJobIds = []
      this.savedJobs = []
      this.savingJobIds = []
      this.loadingSavedJobIds = false
      this.loadingSavedJobs = false
    },
    clearAppliedJobs() {
      this.appliedJobIds = []
      this.appliedJobs = []
      this.applyingJobIds = []
      this.removingAppliedJobIds = []
      this.loadingAppliedJobIds = false
      this.loadingAppliedJobs = false
    },
    async fetchSavedJobIds() {
      this.loadingSavedJobIds = true

      try {
        const user = await this.getCurrentUser()

        if (!user) {
          this.savedJobIds = []
          return []
        }

        const { $supabase } = useNuxtApp()
        const { data, error } = await $supabase
          .schema('jobs')
          .from('saved_jobs')
          .select('job_id')
          .eq('user_id', user.id)

        if (error) throw error

        this.savedJobIds = (data || []).map((item: { job_id: string }) => item.job_id)
        return this.savedJobIds
      } catch (error) {
        console.error('Error fetching saved jobs:', error)
        this.savedJobIds = []
        return []
      } finally {
        this.loadingSavedJobIds = false
      }
    },
    async fetchSavedJobs() {
      this.loadingSavedJobs = true

      try {
        const user = await this.getCurrentUser()

        if (!user) {
          this.clearSavedJobs()
          return []
        }

        const { $supabase } = useNuxtApp()
        const { data, error } = await $supabase
          .schema('jobs')
          .from('saved_jobs_with_job_info')
          .select('*')
          .eq('user_id', user.id)
          .order('saved_at', { ascending: false })

        if (error) throw error

        this.savedJobs = data || []
        this.savedJobIds = this.savedJobs
          .map((job: JobRecord) => job.id)
          .filter(Boolean) as string[]

        return this.savedJobs
      } catch (error) {
        console.error('Error fetching saved jobs:', error)
        this.savedJobs = []
        return []
      } finally {
        this.loadingSavedJobs = false
      }
    },
    async saveJob(jobId?: string) {
      if (!jobId || this.isSavingJob(jobId)) return

      const toast = useToast()
      this.savingJobIds.push(jobId)

      try {
        const user = await this.getCurrentUser()

        if (!user) {
          toast.add({
            title: 'Sign in to save jobs',
            description: 'Saved jobs are stored on your account.',
            icon: 'i-lucide-bookmark',
            color: 'warning'
          })
          return navigateTo('/auth/signin')
        }

        const { $supabase } = useNuxtApp()
        const { error } = await $supabase
          .schema('jobs')
          .from('saved_jobs')
          .insert({
            user_id: user.id,
            job_id: jobId
          })

        if (error && error.code !== '23505') throw error

        if (!this.savedJobIds.includes(jobId)) {
          this.savedJobIds.push(jobId)
        }

        toast.add({
          title: 'Job saved',
          icon: 'i-lucide-bookmark-check',
          color: 'success'
        })
      } catch (error: any) {
        toast.add({
          title: 'Could not save job',
          description: error.message || 'Please try again.',
          icon: 'i-lucide-bookmark',
          color: 'error'
        })
      } finally {
        this.savingJobIds = this.savingJobIds.filter((id) => id !== jobId)
      }
    },
    async unsaveJob(jobId?: string) {
      if (!jobId || this.isSavingJob(jobId)) return

      const toast = useToast()
      this.savingJobIds.push(jobId)

      try {
        const user = await this.getCurrentUser()

        if (!user) {
          this.clearSavedJobs()
          return
        }

        const { $supabase } = useNuxtApp()
        const { error } = await $supabase
          .schema('jobs')
          .from('saved_jobs')
          .delete()
          .eq('user_id', user.id)
          .eq('job_id', jobId)

        if (error) throw error

        this.savedJobIds = this.savedJobIds.filter((id) => id !== jobId)
        this.savedJobs = this.savedJobs.filter((job) => job.id !== jobId)

        toast.add({
          title: 'Removed from saved jobs',
          icon: 'i-lucide-bookmark-minus',
          color: 'success'
        })
      } catch (error: any) {
        toast.add({
          title: 'Could not remove saved job',
          description: error.message || 'Please try again.',
          icon: 'i-lucide-bookmark',
          color: 'error'
        })
      } finally {
        this.savingJobIds = this.savingJobIds.filter((id) => id !== jobId)
      }
    },
    async toggleSavedJob(jobId?: string) {
      if (this.isJobSaved(jobId)) {
        await this.unsaveJob(jobId)
      } else {
        await this.saveJob(jobId)
      }
    },
    async fetchAppliedJobIds() {
      this.loadingAppliedJobIds = true

      try {
        const user = await this.getCurrentUser()

        if (!user) {
          this.appliedJobIds = []
          return []
        }

        const { $supabase } = useNuxtApp()
        const { data, error } = await $supabase
          .schema('jobs')
          .from('applications')
          .select('job_id')
          .eq('user_id', user.id)

        if (error) throw error

        this.appliedJobIds = (data || []).map((item: { job_id: string }) => item.job_id)
        return this.appliedJobIds
      } catch (error) {
        console.error('Error fetching applied jobs:', error)
        this.appliedJobIds = []
        return []
      } finally {
        this.loadingAppliedJobIds = false
      }
    },
    async fetchAppliedJobs() {
      this.loadingAppliedJobs = true

      try {
        const user = await this.getCurrentUser()

        if (!user) {
          this.clearAppliedJobs()
          return []
        }

        const { $supabase } = useNuxtApp()
        const { data, error } = await $supabase
          .schema('jobs')
          .from('applications_with_job_info')
          .select('*')
          .eq('user_id', user.id)
          .order('applied_at', { ascending: false })

        if (error) throw error

        this.appliedJobs = data || []
        this.appliedJobIds = this.appliedJobs
          .map((job: JobRecord) => job.id)
          .filter(Boolean) as string[]

        return this.appliedJobs
      } catch (error) {
        console.error('Error fetching applied jobs:', error)
        this.appliedJobs = []
        return []
      } finally {
        this.loadingAppliedJobs = false
      }
    },
    async markJobApplied(jobId?: string) {
      if (!jobId || this.isApplyingJob(jobId)) return false

      const toast = useToast()
      this.applyingJobIds.push(jobId)

      try {
        const user = await this.getCurrentUser()

        if (!user) return false

        const { $supabase } = useNuxtApp()
        const { error } = await $supabase
          .schema('jobs')
          .from('applications')
          .insert({
            user_id: user.id,
            job_id: jobId,
            status: 'applied'
          })

        if (error && error.code !== '23505') throw error

        if (!this.appliedJobIds.includes(jobId)) {
          this.appliedJobIds.push(jobId)
        }

        toast.add({
          title: 'Application tracked',
          description: 'You can review it from your profile.',
          icon: 'i-lucide-clipboard-check',
          color: 'success'
        })

        return true
      } catch (error: any) {
        toast.add({
          title: 'Could not track application',
          description: error.message || 'Please try again.',
          icon: 'i-lucide-clipboard-x',
          color: 'error'
        })

        return false
      } finally {
        this.applyingJobIds = this.applyingJobIds.filter((id) => id !== jobId)
      }
    },
    async removeAppliedJob(jobId?: string) {
      if (!jobId || this.isRemovingAppliedJob(jobId)) return false

      const toast = useToast()
      this.removingAppliedJobIds.push(jobId)

      try {
        const user = await this.getCurrentUser()

        if (!user) {
          this.clearAppliedJobs()
          return false
        }

        const { $supabase } = useNuxtApp()
        const { error } = await $supabase
          .schema('jobs')
          .from('applications')
          .delete()
          .eq('user_id', user.id)
          .eq('job_id', jobId)

        if (error) throw error

        this.appliedJobIds = this.appliedJobIds.filter((id) => id !== jobId)
        this.appliedJobs = this.appliedJobs.filter((job) => job.id !== jobId)

        toast.add({
          title: 'Application removed',
          icon: 'i-lucide-clipboard-minus',
          color: 'success'
        })

        return true
      } catch (error: any) {
        toast.add({
          title: 'Could not remove application',
          description: error.message || 'Please try again.',
          icon: 'i-lucide-clipboard-x',
          color: 'error'
        })

        return false
      } finally {
        this.removingAppliedJobIds = this.removingAppliedJobIds.filter((id) => id !== jobId)
      }
    }
  },

})
