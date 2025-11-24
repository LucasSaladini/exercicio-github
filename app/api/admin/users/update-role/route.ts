import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function PUT(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const body = await req.json()
    const { user_id, new_role } = body

    if (!["admin", "attendant"].includes(new_role)) {
      return NextResponse.json(
        { error: "Invalid role. Only admin or attendant allowed" },
        { status: 400 }
      )
    }

    const { data: target } = await supabase.auth.admin.getUserById(user_id)

    if (!target?.user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const currentRole = target.user.user_metadata?.role

    if (currentRole === "customer" && new_role === "customer") {
      return NextResponse.json(
        { error: "Customers cannot be modified through admin panel" },
        { status: 400 }
      )
    }

    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
      user_id,
      { user_metadata: { role: new_role } }
    )

    if (updateAuthError) {
      return NextResponse.json(
        { error: updateAuthError.message },
        { status: 400 }
      )
    }

    const { error: updateDbError } = await supabase
      .from("users")
      .update({ role: new_role })
      .eq("id", user_id)

    if (updateDbError) {
      return NextResponse.json(
        { error: updateDbError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Role updated successfully", user_id, new_role },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: "Unexpected error", details: String(error) },
      { status: 500 }
    )
  }
}
