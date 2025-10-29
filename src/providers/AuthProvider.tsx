"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/useAuthStore"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkSession, loading } = useAuthStore()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return <>{children}</>
}
