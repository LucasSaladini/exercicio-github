"use client"

import { useEffect, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe
} from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import type { Stripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!)

interface Product {
  id: string
  name: string
  quantity: number
  price: number
}

type PaymentFormProps = {
  clientSecret: string
  amount: number
  products: Product[]
}

type PaymentRequest = ReturnType<NonNullable<Stripe>["paymentRequest"]>

function CheckoutInner({ clientSecret, amount, products }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null
  )

  const formatCurrency = (value: number) => value.toFixed(2).replace(".", ",")

  useEffect(() => {
    if (!stripe) return

    const pr = stripe.paymentRequest({
      country: "BR",
      currency: "brl",
      total: {
        label: "Pedido Restaurante",
        amount: Math.round(amount * 100)
      },
      requestPayerName: true,
      requestPayerEmail: true
    })

    pr.canMakePayment().then((result) => {
      if (result) setPaymentRequest(pr)
    })
  }, [stripe, amount])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`
      }
    })

    if (error) {
      alert(error.message)
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Lista de produtos dentro do checkout */}
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
          <span>R$ {formatCurrency(amount)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        <Button type="submit" disabled={loading || !stripe}>
          {loading ? "Processando pagamento" : "Pagar agora"}
        </Button>
      </form>
    </div>
  )
}

export default function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret: props.clientSecret }}
    >
      <CheckoutInner {...props} />
    </Elements>
  )
}
