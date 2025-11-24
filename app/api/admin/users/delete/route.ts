import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await req.json()
    const { user_id } = body

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 })
    }

    const { data: userExists, error: userExistsError } = await supabase
      .from("users")
      .select("id")
      .eq("id", user_id)
      .single()

    if (userExistsError || !userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { error: deleteUserError } = await supabase
      .from("users")
      .delete()
      .eq("id", user_id)

    if (deleteUserError) {
      return NextResponse.json({ error: deleteUserError.message }, { status: 500 })
    }

    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user_id)
    if (deleteAuthError) {
      return NextResponse.json({ error: deleteAuthError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
