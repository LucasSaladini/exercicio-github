import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Parser } from "json2csv"
import PDFDocument from "pdfkit"
import streamBuffers from "stream-buffers"

type OrderItemWithProduct = {
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  products: {
    name: string | null
  }[]
}

type OrderWithItems = {
  id: number
  order_items: OrderItemWithProduct[]
}

type ReviewData = {
  order_id: number
  rating: number
}

type ReportEntry = {
  orderId: string
  productName: string
  totalSales: number
  totalRevenue: number
  avgRating: number
  ratingCount: number
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const url = new URL(req.url)
  const startDate = url.searchParams.get("startDate") || "1970-01-01"
  const endDate = url.searchParams.get("endDate") || new Date().toISOString()
  const type = url.searchParams.get("type") || "csv"

  const { data: salesData, error: salesError } = await supabase
    .from("orders")
    .select(`
      id,
      order_items (
        product_id,
        quantity,
        unit_price,
        total_price,
        products (
          name
        )
      )
    `)
    .gte("created_at", startDate)
    .lte("created_at", endDate)

  console.log("salesError", salesError)
  console.log("Sales raw data:", salesData)

  if (salesError) {
    return NextResponse.json({ error: salesError.message }, { status: 500 })
  }

  const { data: reviewsData, error: reviewsError } = await supabase
    .from("orders_reviews")
    .select("order_id, rating")
    .gte("created_at", startDate)
    .lte("created_at", endDate)

  console.log("reviewsError", reviewsError)
  console.log("Reviews raw data:", reviewsData)

  if (reviewsError) {
    return NextResponse.json({ error: reviewsError.message }, { status: 500 })
  }

  const reportMap: Record<string, ReportEntry> = {}

  salesData?.forEach((order: OrderWithItems) => {
    const orderId = order.id.toString()
    const items = order.order_items || []

    const productName =
    items.length > 0
      ? items
          .map((i) => {
            const prods = Array.isArray(i.products)
              ? i.products
              : i.products
              ? [i.products]
              : []
  
            return prods.map((p) => p.name ?? "Produto sem nome").join(", ")
          })
          .join(", ")
      : `Pedido ${orderId}`

    const totalSales = items.reduce((acc, i) => acc + i.quantity, 0)
    const totalRevenue = items.reduce((acc, i) => acc + i.total_price, 0)

    reportMap[orderId] = {
      orderId,
      productName,
      totalSales,
      totalRevenue,
      avgRating: 0,
      ratingCount: 0,
    }
  })

  reviewsData?.forEach((review: ReviewData) => {
    const orderId = review.order_id.toString()

    if (!reportMap[orderId]) {
      reportMap[orderId] = {
        orderId,
        productName: `Pedido ${orderId}`,
        totalSales: 0,
        totalRevenue: 0,
        avgRating: 0,
        ratingCount: 0,
      }
    }

    reportMap[orderId].avgRating += review.rating
    reportMap[orderId].ratingCount += 1
  })

  const report = Object.values(reportMap).map((r) => ({
    orderId: r.orderId,
    productName: r.productName,
    totalSales: r.totalSales,
    totalRevenue: r.totalRevenue,
    avgRating: r.ratingCount
      ? Number((r.avgRating / r.ratingCount).toFixed(2))
      : 0,
  }))

  if (type === "pdf") {
    const PDFDocument = require("pdfkit");
    const streamBuffers = require("stream-buffers");
  
    const doc = new PDFDocument({
      margins: { top: 50, left: 40, right: 40, bottom: 40 },
      size: "A4"
    });
  
    const buffer = new streamBuffers.WritableStreamBuffer();
    doc.pipe(buffer);
  
    doc.fontSize(16).text("Pedido Express", { align: "left", underline: false });
    doc.fontSize(10).fillColor("#666").text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`);
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor("#ccc").stroke();
  
    doc.moveDown(1.5);
  
    doc.fillColor("#000");
    doc.fontSize(20).text("Relatório de Vendas", { align: "center" });
    doc.moveDown(1);
  
    const tableTop = doc.y;
    const columnWidths = {
      produto: 220,
      vendas: 100,
      faturamento: 150
    };
  
    doc.fontSize(12).fillColor("#000").text("Produto", 40, tableTop, { width: columnWidths.produto });
    doc.text("Vendas", 260, tableTop, { width: columnWidths.vendas, align: "right" });
    doc.text("Faturamento (R$)", 360, tableTop, { width: columnWidths.faturamento, align: "right" });
  
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor("#aaa").stroke();
  
    doc.moveDown(0.8);

    let y = doc.y;
    let totalVendas = 0;
    let totalFaturamento = 0;
  
    report.forEach((item: any) => {
      doc.fontSize(11).fillColor("#333");
  
      doc.text(item.productName, 40, y, { width: columnWidths.produto });
      doc.text(String(item.totalSales), 260, y, {
        width: columnWidths.vendas,
        align: "right",
      });
      doc.text(item.totalRevenue.toFixed(2).replace('.', ','), 360, y, {
        width: columnWidths.faturamento,
        align: "right",
      });
  
      y += 22;
  
      totalVendas += item.totalSales;
      totalFaturamento += item.totalRevenue;
    });
  
    doc.moveTo(40, y + 10).lineTo(550, y + 10).strokeColor("#666").stroke();
    doc.moveDown(1);
  
    doc.fontSize(13).fillColor("#000").text("Totais Gerais", 40, y + 20);
    doc.fontSize(11).text(`Total de Vendas: ${totalVendas}`, 40, y + 45);
    doc.text(`Total de Faturamento: R$ ${totalFaturamento.toFixed(2).replace('.', ',')}`, 40, y + 65);
  
    doc.end();
  
    await new Promise((resolve) => doc.on("end", resolve));
  
    const pdfBuffer = buffer.getContents() || Buffer.from("");
  
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=relatorio.pdf`
      }
    });
  }  

  const parser = new Parser({
    fields: ["orderId", "productName", "totalSales", "totalRevenue", "avgRating"],
  })

  const csv = parser.parse(report)

  return new NextResponse(JSON.stringify({ report }), {
    headers: {
      "Content-Type": type === "csv" ? "text/csv" : "application/json",
      "Content-Disposition": `attachment; filename="relatorio_pedidos_${startDate}_${endDate}.csv"`,
    },
  })
}
