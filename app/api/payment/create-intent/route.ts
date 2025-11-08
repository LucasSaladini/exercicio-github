import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-10-29.clover"
})

export async function POST(req: Request) {
    try {
        const { orderId, amount, currency = "brl", customerEmail } = await req.json()
        const amountInCents = Math.round(amount * 100)

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency,
            payment_method_types: ["card"],
            description: `Pagamento do pedido #${orderId}`,
            receipt_email: customerEmail,
            metadata: { orderId }
        })

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        })
    } catch (error) {
        console.log(error)
        return new NextResponse("Erro criando PaymentIntent", { status: 500 })
    }
}