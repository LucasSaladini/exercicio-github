'use client'

import { create } from "zustand"
import { createClient } from "@/lib/supabase/client"
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js"

const supabase = createClient()

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  checkSession: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),

  checkSession: async () => {
    if (get().initialized) return

    set({ loading: true })
    try {
      const { data } = await supabase.auth.getSession()
      set({ user: data?.session?.user ?? null, initialized: true })
    } catch (err) {
      console.error("Erro ao checar sessão:", err)
      set({ user: null, initialized: true })
    } finally {
      set({ loading: false })
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null })
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
