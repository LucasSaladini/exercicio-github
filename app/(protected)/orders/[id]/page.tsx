"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import clsx from "clsx"
import ReviewForm from "@/components/ReviewForm"
import ReviewList from "@/components/ReviewList"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

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

interface Review {
  id: number
  order_id: number
  rating: number
  comment: string
  created_at: string
}

export default function OrderPage() {
  const supabase = createClientComponentClient()
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasReview, setHasReview] = useState(false)
  const [review, setReview] = useState<Review | null>(null)
  const [reviewsUpdated, setReviewsUpdated] = useState(false)

  const orderId = params?.id ? Number(params.id) : null

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    preparing: "Em preparo",
    ready: "Pronto",
    delivered: "Entregue"
  }

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

  useEffect(() => {
    if (!orderId) return

    const fetchOrder = async () => {
      try {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select(`
            *,
            order_items (
              quantity,
              product:products (
                name,
                price
              )
            )
          `)
          .eq("id", orderId)
          .maybeSingle()

        if (orderError) throw orderError
        if (!orderData) {
          setOrder(null)
          setLoading(false)
          return
        }

        const items: OrderItem[] = (orderData.order_items ?? []).map(
          (item: { product: { name: any; price: any }; quantity: any }) => ({
            name: item.product?.name ?? "Produto desconhecido",
            quantity: item.quantity,
            price: item.product?.price ?? 0
          })
        )

        setOrder({
          ...orderData,
          items
        } as Order)

        const { data: reviewData, error: reviewError } = await supabase
          .from("orders_reviews")
          .select("*")
          .eq("order_id", orderId)
          .maybeSingle()

        if (reviewError) {
          toast.error("Erro ao buscar avaliação", {
            description: reviewError.message
          })
        } else {
          setReview(reviewData)
          setHasReview(!!reviewData)
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === "object"
            ? JSON.stringify(err)
            : String(err)
        console.error("Erro ao buscar pedido:", message)
        toast.error("Erro ao buscar pedido", { description: message })
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()

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
          if (payload.new) {
            const updatedItems: OrderItem[] = (payload.new.order_items ?? []).map(
              (item: any) => ({
                name: item.product?.name ?? "Produto desconhecido",
                quantity: item.quantity,
                price: item.product?.price ?? 0
              })
            )
            setOrder({ ...payload.new, items: updatedItems } as Order)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, orderId])

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
                {statusLabels[order.status] ?? order.status}
              </Badge>
              <select
                className="bg-black text-white px-3 py-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ml-2"
                value={order.status}
                onChange={async (e) => {
                  const newStatus = e.target.value
                  if (!orderId) return

                  const { error } = await supabase
                    .from("orders")
                    .update({ status: newStatus })
                    .eq("id", orderId)

                  if (error) {
                    toast.error("Erro ao atualizar status", {
                      description: error.message
                    })
                  } else {
                    setOrder((prev) =>
                      prev ? { ...prev, status: newStatus } : prev
                    )
                    toast.success(`Status atualizado para ${statusLabels[newStatus] ?? newStatus}`)
                  }
                }}
              >
                <option value="pending">Pendente</option>
                <option value="preparing">Em preparo</option>
                <option value="ready">Pronto</option>
                <option value="delivered">Entregue</option>
              </select>
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

      <div className="mt-8 space-y-6">
        {!hasReview ? (
          <div>
            <h2 className="text-xl font-semibold mb-2">Avaliar Pedido</h2>
            <ReviewForm
              orderId={order.id}
              onSuccess={() => {
                setHasReview(true)
                setReviewsUpdated((prev) => !prev)
                toast.success("Avaliação enviada com sucesso!")
              }}
            />
          </div>
        ) : (
          <p className="text-green-600 text-sm">
            Avaliação já enviada para este pedido
          </p>
        )}

        <Separator />

        <div>
          <h2 className="text-xl font-semibold mb-2">Avaliações da Loja</h2>
          <ReviewList orderId={order.id} />
        </div>
      </div>
    </div>
  )
}
