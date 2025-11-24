"use client"

import PaymentForm from "@/components/PaymentForm"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

type PaymentProduct = {
  id: string
  name: string
  price: number
  quantity: number
}

export default function CheckoutPage() {
  const { id } = useParams()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [products, setProducts] = useState<PaymentProduct[]>([])
  const [amount, setAmount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`)
        if (!res.ok) throw new Error("Falha ao buscar pedido")
        const data = await res.json()

        setAmount(data.total_amount)

        const productIds = data.order_items.map((item: any) => item.product_id)
        const productsRes = await fetch(`/api/products?ids=${productIds.join(",")}`)
        if (!productsRes.ok) throw new Error("Falha ao buscar produtos")
        const productsData = await productsRes.json()

        const mappedProducts: PaymentProduct[] = data.order_items.map((item: any) => {
          const prod = productsData.find((p: any) => p.id === item.product_id)
          return {
            id: String(item.product_id),
            name: prod?.name || `Produto ${item.product_id}`,
            price: Number(item.unit_price),
            quantity: Number(item.quantity) || 1
          }
        })

        setProducts(mappedProducts)

        if (data.payment_method === "online") {
          const paymentRes = await fetch("/api/payment/create-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: data.id,
              amount: data.total_amount,
              customerEmail: data.customer_name
            })
          })
          if (!paymentRes.ok) throw new Error("Falha ao criar pagamento")
          const paymentData = await paymentRes.json()
          setClientSecret(paymentData.clientSecret)
        }
      } catch (err: any) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id])

  if (loading) return <div>Carregando...</div>
  if (!clientSecret) return <div>Nenhum pagamento disponível</div>

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Pagamento seguro</h1>
        <PaymentForm clientSecret={clientSecret} amount={amount} products={products} />
      </div>
    </div>
  )
}
