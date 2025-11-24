import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get("orderId")

    let query = supabase
      .from("orders_reviews")
      .select(`
        id,
        order_id,
        user_id,
        rating,
        comment,
        created_at,
        orders!fk_order(customer_name, total_amount, status)
      `)

    if (orderId) {
      query = query.eq("order_id", Number(orderId))
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(Array.isArray(data) ? data : [])
  } catch (err) {
    console.error("Erro no GET /api/reviews:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { order_id, rating, comment } = await req.json()

    if (!order_id || !rating) {
      return NextResponse.json(
        { error: "order_id and rating are required" },
        { status: 400 }
      )
    }

    const { error: insertError } = await supabase
      .from("orders_reviews")
      .insert({
        order_id,
        user_id: "anonymous",
        rating,
        comment,
      })

    if (insertError) {
      if (insertError.message.includes("duplicate key")) {
        return NextResponse.json(
          { error: "This order has already been reviewed" },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: "Review created successfully" },
      { status: 201 }
    )
  } catch (err) {
    console.error("Erro no POST /api/reviews:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
