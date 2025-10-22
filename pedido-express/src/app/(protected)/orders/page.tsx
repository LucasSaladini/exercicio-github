"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"

type Order = {
  id: number
  customer_name: string
  status: string
  total_amount: number
  created_at: string
}

export default function OrdersPage() {
  const supabase = createClientComponentClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    const getUserRole = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (user) {
        setUserRole(user.user_metadata.role || null)
      }
    }

    getUserRole()

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.log(error)
      } else {
        setOrders(data || [])
      }

      setLoading(false)
    }

    fetchOrders()

    const channel = supabase
      .channel("orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("Realtime change: ", payload)
          setOrders((prev) => {
            if (payload.eventType === "INSERT") {
              return [payload.new as Order, ...prev]
            } else if (payload.eventType === "UPDATE") {
              return prev.map((o) =>
                o.id === (payload.new as Order).id ? (payload.new as Order) : o
              )
            } else if (payload.eventType === "DELETE") {
              return prev.filter((o) => o.id !== (payload.old as Order).id)
            }

            return prev
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const nextStatus = (current: string) => {
    switch (current) {
      case "pending":
        return "preparing"
      case "preparing":
        return "ready"
      case "ready":
        return "delivered"
      default:
        return current
    }
  }

  const statusColor = (status: string) => {
    return clsx(
      "capitalize transition-colors duration-300 font-semibold",
      status === "pending" && "bg-red-100 text-red-800 border border-red-200",
      status === "preparing" &&
        "bg-yellow-100 text-yellow-800 border border-yellow-200",
      status === "ready" && "bg-blue-100 text-blue-800 border border-blue-200",
      status === "delivered" &&
        "bg-green-100 text-green-800 border border-green-200"
    )
  }

  const handleStatusChange = async (order: Order) => {
    if (userRole !== "attendant") {
      return
    }

    const newStatus = nextStatus(order.status)

    setUpdating(order.id)

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", order.id)

    if (error) {
      console.log(error)
      toast.error(`Erro ao atualizar o status do pedido #${order.id}`)
    } else {
      toast.success(`Pedido #${order.id} atualizado para ${newStatus}`)
    }

    setUpdating(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="animate-spin text-muted-foreground h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-center sm:text-left">
        Gerenciamento de Pedidos
      </h1>
      {orders.length === 0 ? (
        <p className="text-center text-muted-foreground mt-10">
          Nenhum pedido encontrado
        </p>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {orders.map((order) => (
              <motion.div
                key={`${order.id}-${order.status}`}
                initial={{ opacity: 0, y: -20 }}
                animate={
                  order.status === "pending"
                    ? { scale: [1, 1.1, 1], opacity: [1, 0.7, 1] }
                    : { scale: [1.2, 1] }
                }
                transition={{
                  duration: 0.8,
                  repeat: order.status === "pending" ? Infinity : 0
                }}
                exit={{ opacity: 0, y: 20 }}
              >
                <Card key={order.id}>
                  <CardHeader>
                    <CardTitle>
                      Pedido #{order.id} - {order.customer_name}
                      <motion.div
                        key={order.status}
                        initial={{ scale: 1 }}
                        animate={{ scale: [1.2, 1] }}
                        transition={{ duration: 0.3 }}
                      >
                        <Badge className={statusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </motion.div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>
                      <strong>Satus: </strong>{" "}
                      <Badge
                        variant={
                          order.status === "pending"
                            ? "destructive"
                            : order.status === "preparing"
                            ? "default"
                            : order.status === "ready"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {order.status}
                      </Badge>
                    </p>
                    <p>
                      <strong>Total: </strong>${order.total_amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Criado em:{" "}
                      {new Date(order.created_at).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short"
                      })}
                    </p>
                    {userRole === "attendant" &&
                      order.status !== "delivered" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full"
                          onClick={() => handleStatusChange(order)}
                          disabled={updating === order.id}
                        >
                          {updating === order.id
                            ? "Atualizando..."
                            : `Marcado como ${nextStatus(order.status)}`}
                        </Button>
                      )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
