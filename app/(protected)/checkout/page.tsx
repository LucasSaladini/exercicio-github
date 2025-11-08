"use client"

import { useMemo, useState, useEffect } from "react"
import PaymentForm from "@/components/PaymentForm"

interface Product {
  id: string
  name: string
  quantity: number
  price: number
}

type PaymentMethod = "online" | "cash_on_delivery"

interface Address {
  cep: string
  street: string
  number: string
  complement: string
  city: string
  state: string
}

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [amount, setAmount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online")
  const [address, setAddress] = useState<Address>({
    cep: "",
    street: "",
    number: "",
    complement: "",
    city: "",
    state: ""
  })

  const products: Product[] = [
    { id: "1", name: "Hambúrguer Artesanal", quantity: 2, price: 29.9 },
    { id: "2", name: "Batata Frita", quantity: 1, price: 15.5 },
    { id: "3", name: "Refrigerante Lata", quantity: 1, price: 8.5 }
  ]

  const totalAmount = useMemo(
    () => products.reduce((acc, p) => acc + p.price * p.quantity, 0),
    [products]
  )

  const formatCurrency = (value: number) => value.toFixed(2).replace(".", ",")

  useEffect(() => {
    const fetchAddress = async () => {
      const cep = address.cep.replace(/\D/g, "")
      if (cep.length !== 8) return

      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setAddress((prev) => ({
            ...prev,
            street: data.logradouro || "",
            city: data.localidade || "",
            state: data.uf || ""
          }))
        }
      } catch (err) {
        console.error("Erro ao buscar endereço:", err)
      }
    }

    fetchAddress()
  }, [address.cep])

  async function handlePayment() {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (paymentMethod === "cash_on_delivery") {
        if (
          !address.cep ||
          !address.street ||
          !address.city ||
          !address.number ||
          !address.state
        ) {
          setError("Preencha o endereço de entrega corretamente")
          setLoading(false)
          return
        }

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            products,
            totalAmount,
            payment_method: "cash_on_delivery",
            payment_status: "pending_payment",
            address
          })
        })

        if (!res.ok) throw new Error("Falha ao registrar pedido")

        setSuccessMessage("Pedido registrado! Você pagará na entrega. ✅")
        return
      }

      const res = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: "123",
          amount: totalAmount,
          customerEmail: "cliente@teste.com"
        })
      })

      if (!res.ok) throw new Error("Falha ao criar pagamento")

      const data = await res.json()
      setClientSecret(data.clientSecret)
      setAmount(totalAmount)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  if (successMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Pagamento</h1>
          <p className="text-green-600 font-medium">{successMessage}</p>
        </div>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-950">
        <div className="w-full max-w-md bg-gray-950 dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
          <h1 className="text-2xl font-bold text-center">
            Finalizar pagamento
          </h1>
          <div className="w-full max-w-md shadow-md rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-800">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex justify-between border-b pb-2 last:border-b-0 last:pb-0"
              >
                <span>
                  {p.name} x{p.quantity}
                </span>
                <span className="font-medium">
                  R$ {formatCurrency(p.price * p.quantity)}
                </span>
              </div>
            ))}
            <div className="flex justify-between font-semibold pt-4 border-t mt-2">
              <span>Total:</span>
              <span>R$ {formatCurrency(totalAmount)}</span>
            </div>
          </div>
          <div className="flex flex-col space-y-3 mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="paymentMethod"
                value="online"
                checked={paymentMethod === "online"}
                onChange={() => setPaymentMethod("online")}
              />
              <span>💳 Pagamento Online</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="paymentMethod"
                value="cash_on_delivery"
                checked={paymentMethod === "cash_on_delivery"}
                onChange={() => setPaymentMethod("cash_on_delivery")}
              />
              <span>🚚 Pagamento na Entrega</span>
            </label>
          </div>
          {paymentMethod === "cash_on_delivery" && (
            <div className="flex flex-col space-y-2 mt-2 p-4 bg-gray-100 dark:bg-gray-700 rounded">
              <h2 className="font-semibold">Endereço de entrega</h2>

              <input
                type="text"
                placeholder="CEP"
                value={address.cep}
                onChange={(e) =>
                  setAddress({ ...address, cep: e.target.value })
                }
                className="w-full p-2 rounded border"
              />
              <input
                type="text"
                placeholder="Rua"
                value={address.street}
                readOnly
                className="w-full p-2 rounded border bg-gray-200 dark:bg-gray-600"
              />
              <input
                type="text"
                placeholder="Cidade"
                value={address.city}
                readOnly
                className="w-full p-2 rounded border bg-gray-200 dark:bg-gray-600"
              />
              <input
                type="text"
                placeholder="Estado"
                value={address.state}
                readOnly
                className="w-full p-2 rounded border bg-gray-200 dark:bg-gray-600"
              />
              <input
                type="text"
                placeholder="Número"
                value={address.number}
                onChange={(e) =>
                  setAddress({ ...address, number: e.target.value })
                }
                className="w-full p-2 rounded border"
              />
              <input
                type="text"
                placeholder="Complemento"
                value={address.complement}
                onChange={(e) =>
                  setAddress({ ...address, complement: e.target.value })
                }
                className="w-full p-2 rounded border"
              />
            </div>
          )}
          {error && (
            <div className="text-red-500 text-center font-medium">{error}</div>
          )}
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-green-700 cursor-pointer disabled:opacity-50 transition"
          >
            {loading
              ? paymentMethod === "online"
                ? "Gerando pagamento"
                : "Registrando pedido"
              : paymentMethod === "online"
              ? "Pagar agora"
              : "Pagar na entrega"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-4">
          Pagamento seguro
        </h1>
        <PaymentForm
          clientSecret={clientSecret}
          amount={totalAmount}
          products={products}
        />
      </div>
    </div>
  )
}
