"use client"

import { useState, useMemo, useEffect } from "react"
import { CartItem, useCartStore } from "@/hooks/useCartStore"
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

interface Product {
  id: number
  name: string
  price: string
  stock_quantity: number
}

interface OrderSummaryProps {
  items?: CartItem[]
  refreshCart?: () => void
  user?: User | null
}

export function OrderSummary({ items: propItems, refreshCart, user: propUser }: OrderSummaryProps) {
  const { items: storeItems, clearCart, updateQuantity, removeItem } = useCartStore()
  const { user: storeUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])

  const router = useRouter()


  const items = propItems ?? storeItems
  const user = propUser ?? storeUser

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from("products").select("*")
      if (error) {
        toast.error("Erro ao carregar produtos")
        return
      }
      if (data) setProducts(data)
    }
    fetchProducts()
  }, [])

  const itemsWithData = useMemo(() => {
    return items.map(item => {
      const product = products.find(p => p.id === item.product_id)
      return {
        ...item,
        name: product?.name || "Produto desconhecido",
        price: product ? Number(product.price) : 0,
        stock_quantity: product?.stock_quantity || 0
      }
    })
  }, [items, products])

  const total = useMemo(() => itemsWithData.reduce((sum, item) => sum + item.price * item.quantity, 0), [itemsWithData])

  const handleDecrease = (id: string, quantity: number) => {
    const item = itemsWithData.find(i => i.id === id)
    if (!item) return

    if (quantity <= 1) removeItem(id)
    else updateQuantity(id, quantity - 1)
  }

  const handleIncrease = (id: string, quantity: number) => {
    const item = itemsWithData.find(i => i.id === id)
    if (!item) return

    if (item.stock_quantity && quantity + 1 > item.stock_quantity) {
      toast.error(`Máximo disponível: ${item.stock_quantity}`)
      return
    }

    updateQuantity(id, quantity + 1)
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

  const handleSubmit = async () => {
    if (!itemsWithData.length) return toast.error("Carrinho vazio")
    setLoading(true)

    try {
      const payloadItems = itemsWithData.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        price: i.price
      }))

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: payloadItems,
          customer_name: user?.email || "Cliente"
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Erro ao enviar pedido")

      toast.success("Pedido enviado com sucesso")
      clearCart()

      router.push(`/checkout/${data.order.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : JSON.stringify(err)
      toast.error(`Erro ao finalizar pedido: ${message}`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }  

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-lg mb-2">Resumo do Pedido</h3>
      {itemsWithData.length === 0 && <p className="text-sm text-gray-500">Seu carrinho está vazio</p>}

      {itemsWithData.map((item) => (
        <div key={item.id} className="flex items-center justify-between text-sm mb-1">
          <span className="flex-1">{item.name}</span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              onClick={() => handleDecrease(item.id, item.quantity)}
              className="w-8 h-8 flex items-center justify-center"
              aria-label={`Diminuir quantidade de ${item.name}`}
            >-</Button>
            <span className="w-8 text-center">{item.quantity}</span>
            <Button
              size="sm"
              onClick={() => handleIncrease(item.id, item.quantity)}
              className="w-8 h-8 flex items-center justify-center"
              aria-label={`Aumentar quantidade de ${item.name}`}
            >+</Button>
          </div>
          <span className="w-24 text-right">{formatCurrency(item.price * item.quantity)}</span>
        </div>
      ))}

      <div className="flex justify-between border-t mt-2 pt-2 font-semibold">
        <span>Total:</span>
        <span>{formatCurrency(total)}</span>
      </div>

      <div className="flex gap-2 mt-4">
        <Button onClick={clearCart} variant="destructive" className="flex-1" disabled={loading}>
          Limpar Carrinho
        </Button>
        <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
          {loading ? "Enviando..." : "Finalizar Pedido"}
        </Button>
      </div>
    </Card>
  )
}
