import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Parser } from "json2csv"
import PDFDocument from "pdfkit"
import streamBuffers from "stream-buffers"

type ReportEntry = {
  orderId: string
  productName: string
  totalSales: number
  totalRevenue: number
  avgRating: number
  ratingCount: number
}

type OrderItem = {
  product_id: string
  name: string
  price: number
  quantity: number
}

type OrderData = {
  items: OrderItem[]
}

type ReviewData = {
  order_id: number
  rating: number
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const url = new URL(req.url)
  const startDate = url.searchParams.get("startDate") || "1970-01-01"
  const endDate = url.searchParams.get("endDate") || new Date().toISOString()
  const type = url.searchParams.get("type") || "csv"

  const { data: salesData, error: salesError } = await supabase
    .from("orders")
    .select("id, items")
    .gte("created_at", startDate)
    .lte("created_at", endDate)

  console.log("salesError", salesError)
  console.log("Sales raw data:", salesData)

  if (salesError) return NextResponse.json({ error: salesError.message }, { status: 500 })

  const { data: reviewsData, error: reviewsError } = await supabase
    .from("orders_reviews")
    .select("order_id, rating")
    .gte("created_at", startDate)
    .lte("created_at", endDate)

  console.log("reviewsError", reviewsError)
  console.log("Reviews raw data:", reviewsData)

  if (reviewsError) return NextResponse.json({ error: reviewsError.message }, { status: 500 })

  const reportMap: Record<string, ReportEntry> = {}

  salesData?.forEach((order: { id: number; items: OrderItem[] }) => {
    const orderId = order.id.toString()

    const productName =
      order.items && order.items.length > 0
        ? order.items.map((i) => i.name).join(", ")
        : `Pedido ${orderId}`

    const totalSales = order.items?.reduce((acc, i) => acc + i.quantity, 0) || 0
    const totalRevenue =
      order.items?.reduce((acc, i) => acc + i.price * i.quantity, 0) || 0

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
    avgRating: r.ratingCount ? Number((r.avgRating / r.ratingCount).toFixed(2)) : 0,
  }))

  if (type === "pdf") {
    const doc = new PDFDocument({ margin: 40 })
    const buffer = new streamBuffers.WritableStreamBuffer()
    doc.pipe(buffer)

    doc.fontSize(16).text("Relatório de Pedidos e Avaliações", { align: "center" })
    doc.moveDown()

    report.forEach((r) => {
      doc
        .fontSize(12)
        .text(
          `${r.productName} - Vendas: ${r.totalSales} | Faturamento: R$${r.totalRevenue.toFixed(
            2
          )} | Avaliação média: ${r.avgRating.toFixed(1)}`
        )
      doc.moveDown(0.5)
    })

    doc.end()
    const pdfBuffer = buffer.getContents()

    if (!pdfBuffer) return NextResponse.json({ error: "Error Generating PDF" }, { status: 500 })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio_pedidos_${startDate}_${endDate}.pdf"`,
      },
    })
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
