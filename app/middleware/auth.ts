import { useAuthStore } from "~/stores/auth";






export default defineNuxtRouteMiddleware(async(to, from) => {
    console.log("middleware", to.path)
    const { $supabase } = useNuxtApp();
    // const store = useAuthStore()
    // store.authenticated_user
const router = useRouter();
const route = useRoute();
  if(to.path !== '/'){
   const {data: { user },} = await $supabase.auth.getUser();
        if (user) {
            
            
        }
    }
})
