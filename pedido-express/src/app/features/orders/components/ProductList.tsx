"use client"

import { useCartStore } from "../hooks/useCartStore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Product } from "../types"

interface ProductListProps {
  products: Product[]
}

export function ProductList({ products }: ProductListProps) {
  const addItem = useCartStore((s) => s.addItem)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-gray-600">
              R$ {product.price.toFixed(2).replace(".", ",")}
            </p>
          </div>
          <Button onClick={() => addItem(product)} className="mt-4 w-full">
            Adicionar
          </Button>
        </Card>
      ))}
    </div>
  )
}
