import { NextRequest, NextResponse } from "next/server"
import { createClient, getUser } from "@/lib/supabase/server"

type ReportEntry = {
    productId: string
    productName: string
    totalSales: number
    totalRevenue: number
    avgRating: number
    ratingCount: number
}

export async function GET(req: NextRequest) {
    const user = await getUser()

    if(!user || user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const supabase = await createClient()

    const url = new URL(req.url)
    const startDate = url.searchParams.get("startDate") || "1970-01-01"
    const endDate = url.searchParams.get("endDate") || new Date().toISOString()
    const productId = url.searchParams.get("productId")

    let salesQuery = supabase.from("orders").select("product_id, total_price, products(name)").gte("created_at", startDate).lte("created_at", endDate)

    if (productId) {
        salesQuery = salesQuery.eq("product_id", productId)
    }

    const { data: salesData, error: salesError } = await salesQuery

    if (salesError) {
        return NextResponse.json({ error: salesError.message }, { status: 500 })
    }

    let reviewsQuery = supabase.from("orders_reviews").select("product_id, rating").gte("created_at", startDate).lte("created_at", endDate)

    if (productId) {
        reviewsQuery = reviewsQuery.eq("product_id", productId)
    }

    const { data: reviewsData, error: reviewsError } = await reviewsQuery

    if (reviewsError) {
        return NextResponse.json({ error: reviewsError.message }, { status: 500 })
    }

    const reportMap: Record<string, ReportEntry> = {}

    salesData?.forEach((sale) => {
        const id = sale.product_id

        if (reportMap[id]) {
            reportMap[id] = {
                productId: id,
                productName: sale.products?.[id]?.name || "",
                totalSales: 0,
                totalRevenue: 0,
                avgRating: 0,
                ratingCount: 0,
            }
        }

        reportMap[id].totalSales += 1
        reportMap[id].totalRevenue += sale.total_price
    })

    reviewsData?.forEach((review) => {
        const id = review.product_id

        if(!reportMap[id]) {
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
        avgRating: r.ratingCount ? r.avgRating : 0,
    }))

    return NextResponse.json({ report })
}