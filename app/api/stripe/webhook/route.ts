import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/client"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-10-29.clover"
})

const supabase = createClient()

export const POST = async (req: NextRequest) => {
  const sig = req.headers.get("stripe-signature")
  const body = await req.text()

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const userId = paymentIntent.metadata.userId

        const { error } = await supabase
          .from("orders")
          .update({ payment_status: "paid" })
          .eq("user_id", userId)
          .eq("total", paymentIntent.amount / 100)
        if (error) console.error("Erro ao atualizar pedido pago:", error)
        break
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const userId = paymentIntent.metadata.userId

        const { error } = await supabase
          .from("orders")
          .update({ payment_status: "payment_failed" })
          .eq("user_id", userId)
          .eq("total", paymentIntent.amount / 100)
        if (error) console.error("Erro ao atualizar pedido falhou:", error)
        break
      }
      default:
        console.log(`Evento não tratado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("Erro no webhook:", err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
