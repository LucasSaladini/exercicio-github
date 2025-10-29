import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL !,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !,
        {
            cookies: cookieStore
        }
    )
}

export async function getUser() {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if(error || !data?.user) return null
    return data.user
}