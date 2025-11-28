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
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash_on_delivery">("online")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true)
      setError(null)

      try {
        // 1️⃣ Buscar o pedido
        const res = await fetch(`/api/orders/${id}`)
        if (!res.ok) throw new Error("Falha ao buscar pedido")
        const data = await res.json()

        setAmount(data.total_amount)
        setPaymentMethod(data.payment_method)

        // 2️⃣ Buscar produtos
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

        // 3️⃣ Criar PaymentIntent apenas se for pagamento online
        if (data.payment_method === "online") {
          const paymentRes = await fetch("/api/payment/create-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: data.id,
              amount: data.total_amount,
              customerEmail: data.customer_email // ⚠️ precisa ser email real
            })
          })
          if (!paymentRes.ok) {
            const errorData = await paymentRes.json()
            throw new Error(errorData.error || "Falha ao criar pagamento")
          }

          const paymentData = await paymentRes.json()
          setClientSecret(paymentData.clientSecret)
        } else {
          // Se for pagamento na entrega, não precisa de clientSecret
          setClientSecret(null)
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message || "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id])

  if (loading) return <div>Carregando...</div>
  if (error) return <div className="text-red-500 text-center">{error}</div>

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Pagamento seguro</h1>

        {products.map(p => (
          <div key={p.id} className="flex justify-between border-b pb-2 last:border-b-0 last:pb-0">
            <span>{p.name} x{p.quantity}</span>
            <span className="font-medium">R$ {(p.price * p.quantity).toFixed(2).replace(".", ",")}</span>
          </div>
        ))}

        <div className="flex justify-between font-semibold pt-4 border-t mt-2">
          <span>Total:</span>
          <span>R$ {amount.toFixed(2).replace(".", ",")}</span>
        </div>

        {paymentMethod === "online" ? (
          clientSecret ? (
            <PaymentForm clientSecret={clientSecret} amount={amount} products={products} />
          ) : (
            <div className="text-yellow-600 text-center mt-4">
              Preparando pagamento...
            </div>
          )
        ) : (
          <div className="text-green-600 text-center mt-4">
            Pagamento na entrega selecionado ✅
          </div>
        )}
      </div>
    </div>
  )
}
