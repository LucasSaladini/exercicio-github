"use client"

import type React from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function ProtectedPage(props: P) {
    const router = useRouter()
    const { user, loading } = useAuthStore()

    useEffect(() => {
      if (!loading && !user) {
        router.replace("/login")
      }
    }, [loading, user, router])

    if (loading || !user) {
      return (
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Verificando sessão...</p>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }
}
