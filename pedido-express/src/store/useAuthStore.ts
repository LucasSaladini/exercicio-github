'use client'

import { create } from "zustand"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  checkSession: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),

  checkSession: async () => {
    const supabase = createClient()
    set({ loading: true })

    const { data } = await supabase.auth.getUser()
    set({ user: data?.user ?? null, loading: false })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null })
    })
  },

  signOut: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
