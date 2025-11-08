import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase/server"

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user || user.role !== "admin") {
    redirect("/")
  }

  return <>{children}</>
}
