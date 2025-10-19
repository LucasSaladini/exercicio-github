"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/store/useAuthStore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user) router.replace("/menu")
  }, [user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      { email, password }
    )
    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      toast.error(signInError.message)
      return
    }

    if (data.user) {
      setUser(data.user)
      router.push("/menu")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-center">Entrar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <p className="text-red-500 mb-2">{error}</p>}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-sm text-center">
              Não tem conta?{" "}
              <a href="/signup" className="text-blue-600 hover:underline">
                Cadastre-se
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
