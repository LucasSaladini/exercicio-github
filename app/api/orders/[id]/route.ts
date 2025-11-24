import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function GET(req: Request) {
  const supabase = createClient();

  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return NextResponse.json({ error: "ID do pedido não fornecido" }, { status: 400 });
  }

  try {
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", Number(id))
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json(order);
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object"
        ? JSON.stringify(err)
        : String(err);

    console.error("Erro ao buscar pedido:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
