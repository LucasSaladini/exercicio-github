// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

type OrderItem = {
  id: number | string;
  price: number;
  quantity: number;
};

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { items, customer_name } = (await req.json()) as {
      items: OrderItem[];
      customer_name: string;
    };

    if (!items || !items.length) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    // Calcular total
    const total_amount = items.reduce(
      (sum: number, item: OrderItem) => sum + item.price * item.quantity,
      0
    );

    // Criar pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([{ customer_name, total_amount }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Criar itens do pedido
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
