import { useAuthStore } from "~/stores/auth";






export default defineNuxtRouteMiddleware(async(to, from) => {
    console.log("middleware", to.path)
    const { $supabase } = useNuxtApp();
    
const router = useRouter();
const route = useRoute();
    const authStore = useAuthStore();

    const { data: { session }, } = await $supabase.auth.getSession();
    console.log("session", session)
    if (!session && to.path !== '/auth/signin' && to.path !== '/auth/signup') {
        return router.push('/auth/signin');
    }

//    if (session) {
//    const {data: { user },} = await $supabase.auth.getUser();
//    console.log("user", user)
//         if (user) {
//             const store = useAuthStore()
//             console.log("store", store)
//     store.setUser = user
            
//         }
//     }
})
