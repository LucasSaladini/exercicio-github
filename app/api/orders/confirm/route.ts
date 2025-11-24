import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 })
    }

    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", orderId)

    if (itemsError) throw itemsError
    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ error: "No items found for this order" }, { status: 404 })
    }

    for (const item of orderItems) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock_quantity, name")
        .eq("id", item.product_id)
        .single()

      if (productError) throw productError

      if (product.stock_quantity < item.quantity) {
        return NextResponse.json(
          { error: `Stock insufficient for the product ${product.name}` },
          { status: 400 }
        )
      }
    }

    for (const item of orderItems) {
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single()

      const newStock = product?.stock_quantity - item.quantity
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", item.product_id)

      if (updateError) throw updateError
    }

    const { error: orderError } = await supabase
      .from("orders")
      .update({ status: "confirmed" })
      .eq("id", orderId)

    if (orderError) throw orderError

    return NextResponse.json({ message: "Order confirmed and stock updated successfully" })
  } catch (error: unknown) {
    console.error("Error confirming order: ", error)

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
