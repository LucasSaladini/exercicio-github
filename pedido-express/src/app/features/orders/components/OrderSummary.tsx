"use client"

import { useCartStore } from "../hooks/useCartStore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

export function OrderSummary() {
  const { items, clearCart, updateQuantity, removeItem } = useCartStore()
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleSubmit = () => {
    if (!items.length) return toast.error("Carrinho vazio")
    toast.success("Pedido enviado com sucesso")
    clearCart()
  }

  const handleDecrease = (id: string, quantity: number) => {
    if (quantity <= 1) {
      removeItem(id)
    } else {
      updateQuantity(id, quantity - 1)
    }
  }

  const handleIncrease = (id: string, quantity: number) => {
    updateQuantity(id, quantity + 1)
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
            <span className="w-8 text-center">{item.quantity}</span>{" "}
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
