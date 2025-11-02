"use client"

import { useEffect, useState } from "react"

interface Review {
  id: string
  order_id: number
  user_id: string
  rating: number
  comment: string
  created_at: string
  orders: {
    customer_name: string
    total_amount: string
    status: string
  }
}

export default function ReviewList() {
  const [reviews, setReviews] = useState<Review[]>([])

  const fetchReviews = async () => {
    const res = await fetch("/api/reviews")
    const data = await res.json()

    setReviews(data)
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="border p-4 rounded">
          <div className="flex items-center gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={
                  star <= review.rating ? "text-yellow-400" : "text-gray-300"
                }
              >
                *
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Pedido de: {review.orders.customer_name} - Total: $
            {review.orders.total_amount}
          </p>
          {review.comment && <p className="mt-1">{review.comment}</p>}
          <p className="text-xs text-gray-400">
            (new Date(review.created_at).toLocaleString())
          </p>
        </div>
      ))}
    </div>
  )
}
