import { createClient } from "../supabase/server";

type ReportEntry = {
    productId: string
    productName: string
    totalSales: number
    totalRevenue: number
    avgRating: number
    ratingCount: number
}

export async function getReport({ startDate, endDate, productId} : { startDate: string, endDate: string, productId: string | null }) {
    const supabase = await createClient()

    let salesQuery = supabase.from("orders").select("product_id, total_price, products(name)").gte("created_at", startDate).lte("created_at", endDate)

    if (productId) {
        salesQuery = salesQuery.eq("product_id", productId)
    }

    const { data: salesData, error: salesError } = await salesQuery

    if (salesError) {
        throw new Error(salesError.message)
    }

    let reviewsQuery = supabase.from("orders_reviews").select("product_id, rating").gte("created_at", startDate).lte("created_at", endDate)

    if (productId) {
        reviewsQuery = reviewsQuery.eq("product_id", productId)
    }

    const { data: reviewsData, error: reviewsError } = await reviewsQuery

    if (reviewsError) {
        throw new Error (reviewsError.message)
    }

    const reportMap: Record<string, ReportEntry> = {}

    salesData?.forEach((sale) => {
        const id = sale.product_id

        if(!reportMap[id]) {
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

    return Object.values(reportMap).map((r) => ({
        productId: r.productId,
        productName: r.productName,
        totalSales: r.totalSales,
        totalRevenue: r.totalRevenue,
        avgRating: r.avgRating,
        ratingCount: r.ratingCount ? Number((r.avgRating / r.ratingCount).toFixed(2)) : 0,
    }))
} 