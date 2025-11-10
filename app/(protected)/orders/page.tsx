"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import clsx from "clsx"
import { useOrderNotification } from "@/hooks/useOrderNotifications"

type Order = {
  id: number
  customer_name: string
  status: string
  total_amount: number
  created_at: string
  payment_method: string | null
}

export default function OrdersPage() {
  useOrderNotification()
  const supabase = createClientComponentClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, customer_name, status, total_amount, created_at, payment_method"
        )
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar pedidos:", error)
      } else {
        setOrders(data || [])
      }

      setLoading(false)
    }

    fetchOrders()

    const channel = supabase
      .channel("orders-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          setOrders((prev) =>
            prev.map((order) =>
              order.id === payload.new.id ? (payload.new as Order) : order
            )
          )
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          setOrders((prev) => [payload.new as Order, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const statusColor = (status: string): string =>
    clsx(
      "capitalize text-xs px-2 py-1 rounded-full font-semibold",
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-center sm:text-left">Pedidos</h1>

      {orders.length === 0 ? (
        <p className="text-center text-muted-foreground mt-8">
          Nenhum pedido encontrado
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex justify-between items-center">
                  <CardTitle className="text-base font-semibold">
                    {order.customer_name || "Cliente"}
                  </CardTitle>
                  <Badge className={statusColor(order.status)}>
                    {order.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <strong>Total:</strong> ${order.total_amount.toFixed(2)}
                  </p>
                  {order.payment_method && (
                    <p>
                      <strong>Pagamento:</strong> {order.payment_method}
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    {new Date(order.created_at).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short"
                    })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
