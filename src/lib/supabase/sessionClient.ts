import { createBrowserClient } from "@supabase/ssr"

export function createEphemeralClient() {
  return createBrowserClient(
    process.env.pedido_express_SUPABASE_URL!,
    process.env.pedido_express_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: sessionStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )
}
