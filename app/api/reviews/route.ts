import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: reviews, error } = await supabase.from("orders_reviews")
                                                    .select(`id, 
                                                            order_id, 
                                                            user_id,
                                                            rating,
                                                            comment,
                                                            created_at,
                                                            orders!inner(customer_name, total_amount, status`)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(reviews)
}

export async function POST(request: Request) {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const {order_id, rating, comment } = await request.json()

    if(!order_id || !rating) {
        return NextResponse.json({ error: "order_id and rating are required" }, {status: 400 })
    }

    const { data: order, error: orderError } = await supabase.from("orders").select("id, user_id")
                                                                .eq("id", order_id).single()

    if(orderError || !order) {
        return NextResponse.json({ error: "Order not found"}, { status: 404 })
    }

    if(order.user_id !== user.id) {
        return NextResponse.json({ error: "You can only review your own orders"}, { status: 403 })
    }

    const { error: insertError } = await supabase.from("orders_reviews").insert({
        order_id,
        user_id: user.id,
        rating,
        comment
    })

    if (insertError) {
        if(insertError.message.includes("duplicate key")) {
            return NextResponse.json({ error: "This order has already been reviewed"}, { status: 400 })
        }
        return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
    return NextResponse.json({ message: "Review created successfully" }, { status: 201 })
}