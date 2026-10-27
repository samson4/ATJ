import { defineStore } from 'pinia'
import { isJobExpired } from '~/utils/jobDeadline'

type JobRecord = {
  id?: string
  saved_job_id?: string
  saved_at?: string
  application_id?: string
  applied_at?: string
  tracked_at?: string
  status?: string
  [key: string]: any
}

export type ApplicationStatus =
  | 'applied'
  | 'assessment'
  | 'interview_1'
  | 'interview_2'
  | 'interview_3'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'declined_offer'
  | 'on_hold'

export type AppliedJobsQuery = {
  sortBy?: 'applied_at' | 'company_name' | 'role' | 'status'
  sortOrder?: 'asc' | 'desc'
  status?: ApplicationStatus
}

type JobState = {
  selectedJob: JobRecord
  jobList: JobRecord[]
  savedJobIds: string[]
  savedJobs: JobRecord[]
  savedJobsTotal: number
  loadingSavedJobIds: boolean
  loadingSavedJobs: boolean
  savingJobIds: string[]
  appliedJobIds: string[]
  appliedJobs: JobRecord[]
  appliedJobsTotal: number
  loadingAppliedJobIds: boolean
  loadingAppliedJobs: boolean
  applyingJobIds: string[]
  removingAppliedJobIds: string[]
  updatingApplicationStatusIds: string[]
}

type JobReference = string | JobRecord | undefined

const getJobId = (job: JobReference) => {
  return typeof job === 'string' ? job : job?.id
}

const resolveJobRecord = (state: JobState, job: JobReference) => {
  if (!job) return undefined
  if (typeof job !== 'string') return job

  return [state.selectedJob, ...state.jobList, ...state.savedJobs, ...state.appliedJobs]
    .find((item) => item?.id === job)
}

const isExpiredJobReference = (state: JobState, job: JobReference) => {
  return isJobExpired(resolveJobRecord(state, job))
}


export const useJobStore = defineStore('job', {
  state: (): JobState => ({
    selectedJob: {},
    jobList: [],
    savedJobIds: [],
    savedJobs: [],
    savedJobsTotal: 0,
    loadingSavedJobIds: false,
    loadingSavedJobs: false,
    savingJobIds: [],
    appliedJobIds: [],
    appliedJobs: [],
    appliedJobsTotal: 0,
    loadingAppliedJobIds: false,
    loadingAppliedJobs: false,
    applyingJobIds: [],
    removingAppliedJobIds: [],
    updatingApplicationStatusIds: []
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
    },
    isUpdatingApplicationStatus: (state) => {
      return (jobId?: string) => !!jobId && state.updatingApplicationStatusIds.includes(jobId)
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
      this.savedJobsTotal = 0
      this.savingJobIds = []
      this.loadingSavedJobIds = false
      this.loadingSavedJobs = false
    },
    clearAppliedJobs() {
      this.appliedJobIds = []
      this.appliedJobs = []
      this.appliedJobsTotal = 0
      this.applyingJobIds = []
      this.removingAppliedJobIds = []
      this.updatingApplicationStatusIds = []
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
      } catch {
        this.savedJobIds = []
        return []
      } finally {
        this.loadingSavedJobIds = false
      }
    },
    async fetchSavedJobs(page = 1, itemsPerPage = 10) {
      this.loadingSavedJobs = true

      try {
        const user = await this.getCurrentUser()

        if (!user) {
          this.clearSavedJobs()
          return []
        }

        const { $supabase } = useNuxtApp()
        const from = (page - 1) * itemsPerPage
        const to = from + itemsPerPage - 1
        const { data, error, count } = await $supabase
          .schema('jobs')
          .from('saved_jobs_with_job_info')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .order('saved_at', { ascending: false })
          .range(from, to)

        if (error) throw error

        this.savedJobs = data || []
        this.savedJobsTotal = count ?? this.savedJobs.length

        return this.savedJobs
      } catch {
        this.savedJobs = []
        this.savedJobsTotal = 0
        return []
      } finally {
        this.loadingSavedJobs = false
      }
    },
    async saveJob(job: JobReference) {
      const jobId = getJobId(job)
      if (!jobId || this.isSavingJob(jobId)) return

      const toast = useToast()
      if (isExpiredJobReference(this.$state, job)) {
        toast.add({
          title: 'Job expired',
          description: 'This job is no longer accepting new actions.',
          icon: 'i-lucide-lock',
          color: 'warning'
        })
        return
      }

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
        this.savedJobsTotal = Math.max(0, this.savedJobsTotal - 1)

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
    async toggleSavedJob(job: JobReference) {
      const jobId = getJobId(job)

      if (this.isJobSaved(jobId)) {
        await this.unsaveJob(jobId)
      } else {
        await this.saveJob(job)
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
      } catch {
        this.appliedJobIds = []
        return []
      } finally {
        this.loadingAppliedJobIds = false
      }
    },
    async fetchAppliedJobs(page = 1, itemsPerPage = 10, options: AppliedJobsQuery = {}) {
      this.loadingAppliedJobs = true

      try {
        const user = await this.getCurrentUser()

        if (!user) {
          this.clearAppliedJobs()
          return []
        }

        const { $supabase } = useNuxtApp()
        const from = (page - 1) * itemsPerPage
        const to = from + itemsPerPage - 1
        const sortBy = options.sortBy || 'applied_at'
        const sortOrder = options.sortOrder || 'desc'
        let query = $supabase
          .schema('jobs')
          .from('applications_with_job_info')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
        if (options.status) {
          query = query.eq('status', options.status)
        }
        const { data, error, count } = await query
          .order(sortBy, { ascending: sortOrder === 'asc' })
          .range(from, to)

        if (error) throw error

        this.appliedJobs = data || []
        this.appliedJobsTotal = count ?? this.appliedJobs.length

        return this.appliedJobs
      } catch {
        this.appliedJobs = []
        this.appliedJobsTotal = 0
        return []
      } finally {
        this.loadingAppliedJobs = false
      }
    },
    async markJobApplied(job: JobReference) {
      const jobId = getJobId(job)
      if (!jobId || this.isApplyingJob(jobId)) return false

      const toast = useToast()
      if (isExpiredJobReference(this.$state, job)) {
        toast.add({
          title: 'Job expired',
          description: 'This job is no longer accepting new actions.',
          icon: 'i-lucide-lock',
          color: 'warning'
        })
        return false
      }

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
        this.appliedJobsTotal = Math.max(0, this.appliedJobsTotal - 1)

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
    },
    async updateAppliedJobStatus(jobId: string | undefined, status: ApplicationStatus) {
      if (!jobId || this.isUpdatingApplicationStatus(jobId)) return false

      const toast = useToast()
      this.updatingApplicationStatusIds.push(jobId)

      try {
        const user = await this.getCurrentUser()

        if (!user) {
          toast.add({
            title: 'Sign in to update application status',
            description: 'Application statuses are saved to your account.',
            icon: 'i-lucide-lock',
            color: 'warning'
          })
          return false
        }

        const { $supabase } = useNuxtApp()
        const { data, error } = await $supabase
          .schema('jobs')
          .from('applications')
          .update({ status })
          .eq('user_id', user.id)
          .eq('job_id', jobId)
          .select('job_id')
          .maybeSingle()

        if (error) throw error
        if (!data) throw new Error('Application not found or you do not have permission to update it.')

        this.appliedJobs = this.appliedJobs.map((application) =>
          application.id === jobId ? { ...application, status } : application
        )

        if (this.selectedJob?.id === jobId) {
          this.selectedJob = { ...this.selectedJob, status }
        }

        toast.add({
          title: 'Application status updated',
          icon: 'i-lucide-circle-check',
          color: 'success'
        })

        return true
      } catch (error: any) {
        toast.add({
          title: 'Could not update application status',
          description: error.message || 'Please try again.',
          icon: 'i-lucide-circle-x',
          color: 'error'
        })

        return false
      } finally {
        this.updatingApplicationStatusIds = this.updatingApplicationStatusIds.filter((id) => id !== jobId)
      }
    }
  },

})