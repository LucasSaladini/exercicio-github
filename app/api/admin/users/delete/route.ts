import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function DELETE(req: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const body = await req.json()
        const { user_id } = body

        if (!user_id) {
            return NextResponse.json(
                { error: "user_id is required" },
                { status: 400 }
            )
        }

        const { data: { session }, } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { data: currentUser } = await supabase.from("users").select("role").eq("id", session.user.id).single()

        if (!currentUser || currentUser.role !== "admin") {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            )
        }

        const { data: userExists } = await supabase.from("users").select("id").eq("id", user_id).single()

        if (!userExists) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        await supabase.from("users").delete().eq("id", user_id)

        const deleteAuth = await supabase.auth.admin.deleteUser(user_id)

        if(deleteAuth.error) {
            return NextResponse.json(
                { error: deleteAuth.error.message },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { message: "User deleted successfully" },
            { status: 200 }
        )
    } catch (error: any) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}