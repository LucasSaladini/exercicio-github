// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

type OrderItem = {
  id: number | string;
  price: number;
  quantity: number;
};

type Address = {
  street: string;
  number: string;
  city: string;
  state: string;
  zip: string;
};

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      items,
      customer_name,
      payment_method = "online",
      payment_status = "pending_payment",
      address
    } = (await req.json()) as {
      items: OrderItem[];
      customer_name: string;
      payment_method?: "online" | "cash_on_delivery";
      payment_status?: "pending_payment" | "paid" | "payment_failed" | "cash_on_delivery";
      address?: Address;
    };

    if (!items || !items.length) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    const total_amount = items.reduce(
      (sum: number, item: OrderItem) => sum + item.price * item.quantity,
      0
    );

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([{
        customer_name,
        total_amount,
        payment_method,
        payment_status,
        address 
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = items.map((item: OrderItem) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) throw itemsError;

    return NextResponse.json({ success: true, order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message || "Erro ao criar pedido" }, { status: 500 });
  }
}
