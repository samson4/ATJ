import { useAuthStore } from "~/stores/auth";






export default defineNuxtRouteMiddleware(async(to, from) => {
    const { $supabase } = useNuxtApp();
    
const router = useRouter();
const route = useRoute();
    const authStore = useAuthStore();

    const { data: { session }, } = await $supabase.auth.getSession();
    if (!session && to.path !== '/auth/signin' && to.path !== '/auth/signup') {
        return router.push('/auth/signin');
    }

//    if (session) {
//    const {data: { user },} = await $supabase.auth.getUser();
//         if (user) {
//             const store = useAuthStore()
//     store.setUser = user
            
//         }
//     }
})
