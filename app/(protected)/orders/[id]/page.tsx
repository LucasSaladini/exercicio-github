"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import clsx from "clsx"

type OrderItem = {
  name: string
  quantity: number
  price: number
}

type Order = {
  id: number
  customer_name: string
  status: string
  total_amount: number
  created_at: string
  updated_at: string
  payment_method: string | null
  delivery_address: string | null
  items: OrderItem[]
}

export default function OrderPage() {
  const supabase = createClientComponentClient()
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  const orderId = params?.id ? Number(params.id) : null

  useEffect(() => {
    if (!orderId) return

    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single()

      if (error) {
        console.error("Erro ao buscar pedido:", error)
      } else {
        setOrder(data as Order)
      }

      setLoading(false)
    }

    fetchOrder()

    // 🔁 Atualização em tempo real
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          setOrder(payload.new as Order)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, orderId])

  const statusColor = (status: string): string =>
    clsx(
      "capitalize px-3 py-1 rounded-full text-sm font-semibold",
      status === "pending" && "bg-red-100 text-red-800 border border-red-200",
      status === "preparing" &&
        "bg-yellow-100 text-yellow-800 border border-yellow-200",
      status === "ready" && "bg-blue-100 text-blue-800 border border-blue-200",
      status === "delivered" &&
        "bg-green-100 text-green-800 border border-green-200"
    )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="animate-spin text-muted-foreground h-8 w-8" />
      </div>
    )
  }

  if (!order) {
    return (
      <p className="text-center mt-10 text-muted-foreground">
        Pedido não encontrado
      </p>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-center sm:text-left">
        Acompanhamento do Pedido #{order.id}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {order.customer_name}
            <motion.div
              key={order.status}
              initial={{ scale: 1.2 }}
              animate={{ scale: [1.2, 1] }}
              transition={{ duration: 0.3 }}
            >
              <Badge className={statusColor(order.status)}>
                {order.status}
              </Badge>
            </motion.div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <p>
            <strong>Total:</strong> ${order.total_amount.toFixed(2)}
          </p>
          {order.payment_method && (
            <p>
              <strong>Pagamento:</strong> {order.payment_method}
            </p>
          )}
          {order.delivery_address && (
            <p>
              <strong>Endereço de entrega:</strong> {order.delivery_address}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Criado em:{" "}
            {new Date(order.created_at).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short"
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            Atualizado em:{" "}
            {new Date(order.updated_at).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short"
            })}
          </p>

          <div className="pt-4 border-t">
            <h2 className="font-semibold mb-2">Itens do Pedido</h2>
            {order.items && order.items.length > 0 ? (
              <ul className="space-y-2">
                {order.items.map((item, index) => (
                  <li
                    key={index}
                    className="flex justify-between text-sm border-b pb-1"
                  >
                    <span>
                      {item.name} x{item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum item encontrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
