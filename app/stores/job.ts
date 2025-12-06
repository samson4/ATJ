import { defineStore } from 'pinia'
import JobCard from '~/components/JobCard.vue'


export const useJobStore = defineStore('job', {
    state: () => ({ 
         selectedJob: {} ,
         jobList: []
        }),

})