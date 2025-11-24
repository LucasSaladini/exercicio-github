import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client"; 

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  stock_quantity: number;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.from("products").select("*");

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data as Product[]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message || "Erro interno" }, { status: 500 });
  }
}
