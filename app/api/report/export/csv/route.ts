import { NextRequest, NextResponse } from "next/server";
import { getReport } from "@/lib/reports/getReport";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const url = new URL(req.url);
  const startDate = url.searchParams.get("startDate") || "1970-01-01";
  const endDate = url.searchParams.get("endDate") || new Date().toISOString();
  const productId = url.searchParams.get("productId");

  try {
    const report = await getReport({ startDate, endDate, productId });

    const csvHeader = "Produto, Vendas, Faturamento, Média de Avaliação\n";
    const csvRows = report
      .map(
        (r) =>
          `${r.productName}, ${r.totalSales}, ${r.totalRevenue.toFixed(
            2
          )}, ${r.avgRating.toFixed(2)}`
      )
      .join("\n");

    const csv = csvHeader + csvRows;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="relatorio-${startDate}-${endDate}.csv"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
