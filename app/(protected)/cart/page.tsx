"use client"

import { useEffect, useState } from "react"
import { OrderSummary } from "../../features/orders/components/OrderSummary"
import { toast } from "sonner"

export default function CartPage() {
  const [loading, setLoading] = useState(true)

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart")
      if (res.status === 401) {
        toast.error("Usuário não autenticado")
        return
      }
    } catch {
      toast.error("Erro ao carregar carrinho")
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchCart()
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return <p className="p-6">Carregando...</p>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <OrderSummary refreshCart={fetchCart} items={[]} />
    </div>
  )
}
