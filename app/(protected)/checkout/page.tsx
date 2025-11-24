"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import PaymentForm from "@/components/PaymentForm"

type PaymentMethod = "online" | "cash_on_delivery"

interface Address {
  cep: string
  street: string
  number: string
  complement: string
  city: string
  state: string
}

type PaymentProduct = {
  id: string | number
  name: string
  price: number
  quantity: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const [products, setProducts] = useState<PaymentProduct[]>([])
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [amount, setAmount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online")
  const [address, setAddress] = useState<Address>({
    cep: "",
    street: "",
    number: "",
    complement: "",
    city: "",
    state: ""
  })

  const totalAmount = useMemo(
    () => products.reduce((acc, p) => acc + p.price * p.quantity, 0),
    [products]
  )

  const formatCurrency = (value: number) => value.toFixed(2).replace(".", ",")

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/cart")
        if (!res.ok) throw new Error("Falha ao buscar produtos")
        const data: PaymentProduct[] = await res.json()
        setProducts(data.map(p => ({ ...p, id: String(p.id), price: Number(p.price), quantity: p.quantity || 1 })))
      } catch (err: any) {
        console.error(err)
        setError(err.message || "Erro ao carregar produtos")
      }
    }
    fetchProducts()
  }, [])

  async function handlePayment() {
    setLoading(true);
    setError(null);
  
    try {
      if (paymentMethod === "cash_on_delivery") {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: products.map(p => ({ product_id: Number(p.id), quantity: p.quantity, price: p.price })),
            customer_name: "Cliente",
            payment_method: "cash_on_delivery",
            payment_status: "pending_payment",
            address
          })
        });
        if (!res.ok) throw new Error("Falha ao registrar pedido");
        router.push("/checkout-success?method=cash_on_delivery");
        return;
      }
  
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: products.map(p => ({ product_id: Number(p.id), quantity: p.quantity, price: p.price })),
          customer_name: "Cliente",
          payment_method: "online",
        }),
      });
  
      if (!res.ok) throw new Error("Falha ao registrar pedido");
  
      const data = await res.json();
      setClientSecret(data.client_secret);
      setAmount(totalAmount);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-950">
      <div className="w-full max-w-md bg-gray-950 dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">Finalizar pagamento</h1>
        <div className="w-full max-w-md shadow-md rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-800">
          {products.map(p => (
            <div key={p.id} className="flex justify-between border-b pb-2 last:border-b-0 last:pb-0">
              <span>{p.name} x{p.quantity}</span>
              <span className="font-medium">R$ {formatCurrency(p.price * p.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold pt-4 border-t mt-2">
            <span>Total:</span>
            <span>R$ {formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <div className="flex flex-col space-y-3 mt-4">
          <label className="flex items-center space-x-2">
            <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} />
            <span>💳 Pagamento Online</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="radio" name="paymentMethod" value="cash_on_delivery" checked={paymentMethod === "cash_on_delivery"} onChange={() => setPaymentMethod("cash_on_delivery")} />
            <span>🚚 Pagamento na Entrega</span>
          </label>
        </div>

        {error && <div className="text-red-500 text-center font-medium">{error}</div>}

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-green-700 cursor-pointer disabled:opacity-50 transition"
        >
          {loading ? "Processando..." : "Finalizar Pedido"}
        </button>
      </div>
    </div>
  )
}
