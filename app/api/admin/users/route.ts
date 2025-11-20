import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(req.url)

  const page = Number(searchParams.get("page") ?? 1)
  const limit = Number(searchParams.get("limit") ?? 10)
  const from = (page - 1) * limit
  const to = from + limit - 1

  const search = searchParams.get("search")?.trim() ?? ""

  const role = searchParams.get("role") ?? ""

  const sortBy = searchParams.get("sortBy") ?? "created_at"
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.user_metadata.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let query = supabase
    .from("users")
    .select("*", { count: "exact" })
    .range(from, to)
    .order(sortBy, { ascending: sortOrder === "asc" })

  if (search) {
    query = query.ilike("name", `%${search}%`).ilike("email", `%${search}%`)
  }

  if (role) query = query.eq("role", role)

  const { data, error, count } = await query

  if (error) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
}
