"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const paymentIntentId = searchParams.get("payment_intent")

  useEffect(() => {
    if (paymentIntentId) {
      toast.success("Pagamento confirmado com sucesso!")
    }
  }, [paymentIntentId])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 p-6">
      <Card className="max-w-md w-full p-8 text-center shadow-lg border border-gray-200">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Obrigado pelo seu pedido!</h1>
        <p className="text-white-700 mb-6">
          Seu pagamento foi processado com sucesso. Você receberá um e-mail de
          confirmação em breve.
        </p>

        {paymentIntentId && (
          <div className="bg-gray-100 p-3 rounded-md mb-6">
            <span className="text-sm text-gray-800 font-medium">
              ID do pagamento:
            </span>{" "}
            <code className="text-sm text-gray-800 break-all">
              {paymentIntentId}
            </code>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button onClick={() => router.push("/menu")}>Voltar ao menu</Button>
          <Button variant="outline" onClick={() => router.push("/")}>
            Ir para a página inicial
          </Button>
        </div>
      </Card>
    </div>
  )
}
