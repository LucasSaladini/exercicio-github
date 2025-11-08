import { NextResponse } from "next/server";
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-10-29.clover"
})

export async function POST() {
    try {
        const product = await stripe.products.create({
            name: "Pedido Restaurante",
            description: "Pagamento de pedido realizado via plataforma online"
        })

        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: 5000,
            currency: "brl"
        })

        return NextResponse.json({ product, price })
    } catch (error) {
        console.log(error)
        return new NextResponse("Erro criando produto/preço", { status: 500 })
    }
}