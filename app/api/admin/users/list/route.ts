import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

type Role = "admin" | "attendant"

export async function GET() {
    const supabase = createRouteHandlerClient({ cookies })

    try {
    const { data: { user }, } = await supabase.auth.getUser();
  
      if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }
  
      const role = user.user_metadata.role
  
      if (role !== "admin") {
        return NextResponse.json(
          { error: "Only administrators can access this list" },
          { status: 403 }
        )
      }
  
      const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers()
  
      if (authErr) {
        return NextResponse.json(
          { error: "Error listing users from auth", details: authErr.message },
          { status: 500 }
        )
      }
  
      // 4. Buscar dados da tabela public.users
      const { data: dbUsers, error: dbErr } = await supabase.from("users").select("*")

      if (dbErr) {
        return NextResponse.json(
            { error: "Error fetching data from table users" , details: dbErr.message },
            { status: 500 }
        )
      }

      const merged = authUsers.users.map((authUser) => {
        const db = dbUsers.find((u) => u.id === authUser.id)

        const r = authUser.user_metadata?.role

        if (r === "customer") {
            return null
        }

        return {
            id: authUser.id,
            email: authUser.email,
            role: authUser.user_metadata?.role || "customer",
            phone: db?.phone || null,
            full_name: db?.full_name || null,
            address: db?.address || null,
            is_admin: db?.role === "admin",
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at, 
        }
      }).filter(Boolean)

      const order: Record<Role, number> = {
        admin: 1,
        attendant: 2,
      }

      const sorted = merged.sort((a, b) => {
        const roleA = (a?.role as Role)
        const roleB = (b?.role as Role)
      
        if (roleA !== roleB) {
          return order[roleA] - order[roleB]
        }
      
        return (a?.full_name || "").localeCompare(b?.full_name || "")
      })

      return NextResponse.json({ users: sorted}, { status: 200 })
    } catch (error) {
        return NextResponse.json(
            { error: "Unexpected error", details: String(error) },
            { status: 500 }
        )
    }
}