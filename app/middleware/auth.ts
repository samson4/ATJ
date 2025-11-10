import { useAuthStore } from "~/stores/auth";






export default defineNuxtRouteMiddleware(async(to, from) => {
    console.log("middleware", to.path)
    const { $supabase } = useNuxtApp();
    
const router = useRouter();
const route = useRoute();
  if(to.path !== '/'){
   const {data: { user },} = await $supabase.auth.getUser();
   console.log("user", user)
        if (user) {
            const store = useAuthStore()
            console.log("store", store)
    store.setUser = user
            
        }
    }
})
