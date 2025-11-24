import { NextRequest, NextResponse } from "next/server"
import { getReport } from "@/lib/reports/getReport"
import { createClient } from "@/lib/supabase/server"
import PDFDocument from "pdfkit"
import { PassThrough } from "stream"

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const url = new URL(req.url)
  const startDate = url.searchParams.get("startDate") || "1970-01-01"
  const endDate = url.searchParams.get("endDate") || new Date().toISOString()
  const productId = url.searchParams.get("productId")

  try {
    const report = await getReport({ startDate, endDate, productId })

    const doc = new PDFDocument({ margin: 40 })
    const stream = new PassThrough()
    const chunks: Buffer[] = []

    doc.pipe(stream)

    doc.fontSize(20).text("Relatório de Vendas e Avaliações", { align: "center" })
    doc.moveDown()

    report.forEach((r) => {
      doc
        .fontSize(12)
        .text(`Produto: ${r.productName}`)
        .text(`Vendas: ${r.totalSales}`)
        .text(`Faturamento: R$ ${r.totalRevenue.toFixed(2)}`)
        .text(`Média de Avaliações: ${r.avgRating.toFixed(2)}`)
        .moveDown()
    })

    doc.end()

    for await (const chunk of stream) chunks.push(chunk)
    const pdfBuffer = Buffer.concat(chunks)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-${startDate}-${endDate}.pdf"`,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
