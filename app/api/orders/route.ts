import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-10-29.clover" });

type OrderItem = {
  product_id: number;
  price: number;
  quantity: number;
};

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      items,
      customer_name,
      payment_method = "online",
      payment_status = "pending_payment",
    } = (await req.json()) as {
      items: OrderItem[];
      customer_name: string;
      payment_method?: "online" | "cash_on_delivery";
      payment_status?: "pending_payment" | "paid" | "payment_failed" | "cash_on_delivery";
    };

    if (!items || !items.length) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    const total_amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([{ customer_name, total_amount, payment_method, payment_status }])
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) throw itemsError;

    let client_secret: string | null = null;
    if (payment_method === "online") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total_amount * 100),
        currency: "brl",
        metadata: { order_id: order.id.toString() },
      });
      client_secret = paymentIntent.client_secret;
    }

    return NextResponse.json({ success: true, order, client_secret });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object"
        ? JSON.stringify(err, Object.getOwnPropertyNames(err))
        : String(err);

    console.error("Erro ao criar pedido:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}