import { NextRequest, NextResponse } from "next/server"
import { createClient, getUser } from "@/lib/supabase/server"
import { Parser } from "json2csv"
import PDFDocument from "pdfkit"
import streamBuffers from "stream-buffers"

type ReportEntry = {
  productId: string
  productName: string
  totalSales: number
  totalRevenue: number
  avgRating: number
  ratingCount: number
}

type SaleData = {
  product_id: string
  total_price: number
  products?: Array<{
    name?: string
  }>
}

type ReviewData = {
  product_id: string
  rating: number
}

export async function GET(req: NextRequest) {
  const user = await getUser()

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const supabase = await createClient()
  const url = new URL(req.url)
  const startDate = url.searchParams.get("startDate") || "1970-01-01"
  const endDate = url.searchParams.get("endDate") || new Date().toISOString()
  const productId = url.searchParams.get("productId")
  const type = url.searchParams.get("type") || "csv" 

  let salesQuery = supabase
    .from("orders")
    .select("product_id, total_price, products(name)")
    .gte("created_at", startDate)
    .lte("created_at", endDate)

  if (productId) {
    salesQuery = salesQuery.eq("product_id", productId)
  }

  const { data: salesData, error: salesError } = await salesQuery
  if (salesError) {
    return NextResponse.json({ error: salesError.message }, { status: 500 })
  }

  let reviewsQuery = supabase
    .from("orders_reviews")
    .select("product_id, rating")
    .gte("created_at", startDate)
    .lte("created_at", endDate)

  if (productId) {
    reviewsQuery = reviewsQuery.eq("product_id", productId)
  }

  const { data: reviewsData, error: reviewsError } = await reviewsQuery
  if (reviewsError) {
    return NextResponse.json({ error: reviewsError.message }, { status: 500 })
  }

  const reportMap: Record<string, ReportEntry> = {}

  salesData?.forEach((sale: SaleData) => {
    const id = sale.product_id
    if (!reportMap[id]) {
      reportMap[id] = {
        productId: id,
        productName: sale.products?.[0]?.name || "",
        totalSales: 0,
        totalRevenue: 0,
        avgRating: 0,
        ratingCount: 0,
      }
    }
    reportMap[id].totalSales += 1
    reportMap[id].totalRevenue += sale.total_price
  })

  reviewsData?.forEach((review: ReviewData) => {
    const id = review.product_id
    if (!reportMap[id]) {
      reportMap[id] = {
        productId: id,
        productName: "",
        totalSales: 0,
        totalRevenue: 0,
        avgRating: 0,
        ratingCount: 0,
      }
    }
    reportMap[id].avgRating += review.rating
    reportMap[id].ratingCount += 1
  })

  const report = Object.values(reportMap).map((r) => ({
    productId: r.productId,
    productName: r.productName,
    totalSales: r.totalSales,
    totalRevenue: r.totalRevenue,
    avgRating: r.ratingCount
      ? Number((r.avgRating / r.ratingCount).toFixed(2))
      : 0,
  }))

  if (type === "pdf") {
    const doc = new PDFDocument({ margin: 40 })
    const buffer = new streamBuffers.WritableStreamBuffer()

    doc.pipe(buffer)

    doc.fontSize(16).text("Relatório de Vendas e Avaliações", { align: "center" })
    doc.moveDown()

    report.forEach((r) => {
      doc
        .fontSize(12)
        .text(
          `${r.productName || "Produto"} - Vendas: ${r.totalSales} | Faturamento: R$${r.totalRevenue.toFixed(
            2
          )} | Avaliação média: ${r.avgRating.toFixed(1)}`
        )
      doc.moveDown(0.5)
    })

    doc.end()
    const pdfBuffer = buffer.getContents()

    if (!pdfBuffer) {
      return NextResponse.json({ error: "Error Generating PDF" }, { status: 500 })
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio_de_vendas_e_avaliacoes-${startDate}-${endDate}.pdf"`,
      },
    })
  }

  const parser = new Parser({
    fields: ["productName", "totalSales", "totalRevenue", "avgRating"],
  })
  const csv = parser.parse(report)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="relatorio_de_vendas_e_avaliacoes-${startDate}-${endDate}.csv"`,
    },
  })
}
