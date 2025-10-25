"use client"

import { ProductCard, Product } from "@/app/(protected)/products/ProductCard"

interface ProductListProps {
  products: Product[]
}

export function ProductList({ products }: ProductListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
