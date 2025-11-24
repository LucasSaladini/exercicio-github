"use client"

import { useEffect, useState } from "react"

interface Review {
  id: string
  order_id: number
  rating: number
  comment: string
  created_at: string
  orders?: {
    customer_name: string
    total_amount: number | string
    status: string
  }
}

interface ReviewListProps {
  orderId?: number
}


export default function ReviewList({ orderId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReviews = async () => {
    try {
      const url = orderId ? `/api/reviews?orderId=${orderId}` : "/api/reviews"
      const res = await fetch(url)
      const data = await res.json()

      if (Array.isArray(data)) {
        setReviews(data)
      } else {
        setReviews([])
      }
    } catch (err) {
      console.error("Erro ao buscar reviews:", err)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [orderId])

  if (loading) {
    return <p className="text-sm text-gray-500">Carregando avaliações...</p>
  }

  if (reviews.length === 0) {
    return <p className="text-sm text-gray-500">Nenhuma avaliação encontrada</p>
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="border p-4 rounded">
          <div className="flex items-center gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={star <= review.rating ? "text-yellow-400" : "text-gray-300"}
              >
                ★
              </span>
            ))}
          </div>

          {review.comment && <p className="mt-1">{review.comment}</p>}

          <p className="text-xs text-gray-400">
            {new Date(review.created_at).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        </div>
      ))}
    </div>
  )
}
