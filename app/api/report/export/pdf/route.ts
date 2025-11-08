import { NextRequest, NextResponse } from "next/server"
import { getReport } from "@/lib/reports/getReport"
import { createClient, getUser } from "@/lib/supabase/server"
import PDFDocument from "pdfkit"
import { PassThrough } from "stream"

export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
        return NextResponse.json({ error: "Not Authenticated" }, { status: 403 })
    }

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Access Denied" }, { status: 403 })
    }

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
        let message = "An error occurred"
        if (err instanceof Error) {
          message = err.message
        }
        return NextResponse.json({ error: message }, { status: 500 })
      }
    }