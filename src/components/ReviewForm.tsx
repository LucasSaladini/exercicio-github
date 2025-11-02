"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"

interface ReviewFormProps {
  orderId: number
  onSuccess?: () => void
}

export default function ReviewForm({ orderId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.warning("Escolha uma nota de 1 a 5")
      return
    }

    setLoading(true)

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, rating, comment })
    })

    const data = await res.json()

    setLoading(false)

    if (!res.ok) {
      toast.error(`Erro: `, data.error)
      return
    }

    toast.success("Avaliação enviada")
    setRating(0)
    setComment("")
    onSuccess?.()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-2xl ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            *
          </Button>
        ))}
      </div>
      <Textarea
        placeholder="Comentário opcional"
        className="w-full border rounded p-2"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <Button
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Enviando" : "Enviar avaliação"}
      </Button>
    </div>
  )
}
