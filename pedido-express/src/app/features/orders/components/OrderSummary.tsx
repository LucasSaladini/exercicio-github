"use client"

import { CartItem, useCartStore } from "@/hooks/useCartStore"
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { User } from "@supabase/supabase-js"

interface OrderSummaryProps {
  items: CartItem[]
  refreshCart?: () => void
  user?: User | null
}

export function OrderSummary({ refreshCart }: OrderSummaryProps) {
  const { items, clearCart, updateQuantity, removeItem } = useCartStore()
  const { user } = useAuthStore()
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleDecrease = (id: string, quantity: number) => {
    if (quantity <= 1) removeItem(id)
    else updateQuantity(id, quantity - 1)
  }

  const handleIncrease = (id: string, quantity: number) => {
    updateQuantity(id, quantity + 1)
  }

  const handleSubmit = async () => {
    if (!items.length) return toast.error("Carrinho vazio")

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customer_name: user?.email || "Cliente" // pegar usuário logado
        })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Erro ao enviar pedido")

      toast.success("Pedido enviado com sucesso")
      clearCart()
      refreshCart?.()
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error(String(err))
      }
    }
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-lg mb-2">Resumo do Pedido</h3>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between text-sm mb-1"
        >
          <span className="flex-1">{item.name}</span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              onClick={() => handleDecrease(item.id, item.quantity)}
              className="w-8 h-8 flex items-center justify-center"
            >
              -
            </Button>
            <span className="w-8 text-center">{item.quantity}</span>
            <Button
              size="sm"
              onClick={() => handleIncrease(item.id, item.quantity)}
              className="w-8 h-8 flex items-center justify-center"
            >
              +
            </Button>
          </div>
          <span className="w-24 text-right">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL"
            }).format(item.price * item.quantity)}
          </span>
        </div>
      ))}
      <div className="flex justify-between border-t mt-2 pt-2 font-semibold">
        <span>Total:</span>
        <span>
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
          }).format(total)}
        </span>
      </div>
      <div className="flex gap-2 mt-4">
        <Button onClick={clearCart} variant="destructive" className="flex-1">
          Limpar Carrinho
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          Finalizar Pedido
        </Button>
      </div>
    </Card>
  )
}
