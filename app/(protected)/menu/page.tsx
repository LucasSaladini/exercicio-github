"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { OrderSummary } from "../../features/orders/components/OrderSummary"
import { useCartStore } from "@/hooks/useCartStore"
import { useQuery } from "@tanstack/react-query"

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
  const { items: cartItems, addItem, fetchCart } = useCartStore()
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())

  // Carrega carrinho do backend ao abrir a página
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // Produtos (pode manter React Query aqui sem problemas)
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products")
      if (!res.ok) throw new Error("Erro ao carregar produtos")
      return res.json()
    },
    staleTime: 1000 * 60 * 5
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
                onClick={async () => {
                  setAddingIds((prev) => new Set(prev).add(product.id))
                  
                  await addItem(product)

                  toast.success(`${product.name} adicionado ao carrinho!`)

                  setAddingIds((prev) => {
                    const next = new Set(prev)
                    next.delete(product.id)
                    return next
                  })
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