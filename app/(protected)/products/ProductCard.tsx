"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { useCartStore } from "@/hooks/useCartStore"

export interface Product {
  id: string
  name: string
  price: number
  description: string
  stock_quantity: number
  created_at: string
  updated_at: string
  quantity?: number
}

interface ProductCartProps {
  product: Product
}

interface CartItem extends Product {
  quantity: number
}

export function ProductCard({ product }: ProductCartProps) {
  const { addItem, items: cartItems } = useCartStore()
  const [quantity, setQuantity] = useState(
    cartItems.find((i) => i.id == product.id)?.quantity ?? 1
  )

  const increase = () => {
    if (quantity < product.stock_quantity) {
      setQuantity(quantity + 1)
    } else {
      toast.error("Estoque insuficiente")
    }
  }

  const decrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleAddToCart = () => {
    const item: CartItem = { ...product, quantity }
    addItem(item)
    toast.success(`${product.name} adicionado ao carrinho`)
  }

  return (
    <Card className="p-4 flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="mt-1 text-gray-600">{product.description}</p>
        <p className="mt-1 font-medium">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
          }).format(product.price)}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Estoque: {product.stock_quantity}
        </p>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" onClick={decrease} disabled={quantity <= 1}>
          -
        </Button>
        <span>{quantity}</span>
        <Button
          size="sm"
          onClick={increase}
          disabled={quantity >= product.stock_quantity}
        >
          +
        </Button>
        <Button
          className="ml-auto"
          onClick={handleAddToCart}
          disabled={product.stock_quantity === 0}
        >
          Adicionar
        </Button>
      </div>
    </Card>
  )
}
