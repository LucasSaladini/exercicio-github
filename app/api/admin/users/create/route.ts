import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(req: Request) {
    const supabase = createRouteHandlerClient({ cookies })

    try {
        const body = await req.json()
        const { email, password, full_name, role } = body

        if(!["admin", "attendant"].includes(role)) {
            return NextResponse.json(
                { error: "Inalid role. Only admin or attendant can be created" },
                { status: 400 }
            )
        }

        const { data: { user }, } = await supabase.auth.getUser();
      
          if (!user) {
            return NextResponse.json(
              { error: "Not authenticated." },
              { status: 401 }
            );
        }

        const userRole = user.user_metadata?.role;
        if (userRole !== "admin") {
          return NextResponse.json(
            { error: "Access denied.Only administrators can create users." },
            { status: 403 }
          );
        }

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                role,
                full_name
            }
        })

        if (createError) {
            return NextResponse.json({ error: createError.message }, { status: 400 })
        }

        const authUser = newUser.user

        const { error: insertError } = await supabase.from("users").insert({
            id: authUser.id,
            full_name,
            role
        })

        if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        return NextResponse.json(
            {
                message: "User created successfully",
                user_id: authUser.id
            },
            { status: 201 }
        )
    } catch (err) {
        return NextResponse.json(
            { error: "Unexpected error: ", details: String(err) },
            { status: 500 }
        )
    }
}