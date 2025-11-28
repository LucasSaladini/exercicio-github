"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { OrderSummary } from "../../features/orders/components/OrderSummary"
import { useCartStore } from "@/hooks/useCartStore"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

interface Product {
  id: string
  name: string
  price: number
  quantity?: number
  description: string
  stock_quantity: number
  created_at: string
  updated_at: string
}

export default function MenuPage() {
  const queryClient = useQueryClient()
  const { items: cartItems, addItem } = useCartStore()
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())

  const { data: products = [], isLoading: productsLoading } = useQuery<
    Product[]
  >({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products")
      if (!res.ok) throw new Error("Erro ao carregar produtos")
      return res.json()
    },
    staleTime: 1000 * 60 * 5
  })

  const addToCartMutation = useMutation({
    mutationFn: async (product: Product) => {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          quantity:
            cartItems.find((item) => item.id === product.id)?.quantity ?? 1
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erro ao adicionar ao carrinho")
      }

      return res.json()
    },
    onSuccess: async (_, product: Product) => {
      const quantity =
        cartItems.find((item) => item.id === product.id)?.quantity ?? 1

      const item: Product = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        description: product.description,
        stock_quantity: product.stock_quantity,
        created_at: product.created_at,
        updated_at: product.updated_at
      }

      toast.success(`${product.name} adicionado ao carrinho!`)
      await queryClient.invalidateQueries({ queryKey: ["cart"] })

      setAddingIds((prev) => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    },
    onError: (err: unknown, product: Product) => {
      if (err instanceof Error) toast.error(err.message)
      else toast.error(String(err))

      setAddingIds((prev) => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }
  })

  if (productsLoading) return <p className="p-6">Carregando produtos...</p>

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => {
          const isAdding = addingIds.has(product.id)

          return (
            <Card
              key={product.id}
              className="p-4 flex flex-col justify-between"
            >
              <div>
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="mt-1 text-gray-600">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  }).format(product.price)}
                </p>
              </div>
              <Button
                className="mt-4"
                onClick={() => {
                  setAddingIds((prev) => new Set(prev).add(product.id))
                  addToCartMutation.mutate(product)
                }}
                disabled={isAdding}
              >
                {isAdding ? "Adicionando" : "Adicionar ao carrinho"}
              </Button>
            </Card>
          )
        })}
      </div>

      <div className="w-full lg:w-96">
        <OrderSummary items={cartItems} />
      </div>
    </div>
  )
}
