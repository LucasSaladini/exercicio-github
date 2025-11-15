"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { Loader2 } from "lucide-react"
import MainMenu from "@/components/layout/MainMenu"

export default function ProtectedLayout({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, checkSession } = useAuthStore()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    if (
      !loading &&
      !user &&
      !pathname.startsWith("/login") &&
      !pathname.startsWith("/signup")
    ) {
      router.replace("/login")
    }
  }, [user, loading, pathname, router])

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Verificando sessão...
      </div>
    )
  }

  const role = user.role as "admin" | "atendant" | "customer"

  return (
    <div className="min-h-screen flex flex-col">
      <MainMenu role={role} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
