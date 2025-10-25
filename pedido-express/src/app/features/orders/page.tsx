"use client"

import { ProductList } from "./components/ProductList"
import { OrderSummary } from "./components/OrderSummary"
import { Product } from "./types"
import { useCartStore } from "@/hooks/useCartStore"
// import { useQuery } from "@tanstack/react-query"

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Hamburguer",
    price: 20,
    description: "Hamburguer",
    stock_quantity: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "2",
    name: "Batata Frita",
    price: 10,
    description: "Batata frita crocante",
    stock_quantity: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "3",
    name: "Refrigerante",
    price: 8,
    description: "Refrigerante gelado",
    stock_quantity: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export default function OrdersPage() {
  const { items: cartItems } = useCartStore()
  // const { data: products = [], isLoading } = useQuery<Product[]>({
  //   queryKey: ["products"],
  //   queryFn: async () => {
  //     const res = await fetch("/api/products")
  //     if (!res.ok) throw new Error("Erro ao carregar produtos")
  //     return res.json()
  //   }
  // })

  // if (isLoading) return <p className="p-6">Carregando produtos...</p>

  return (
    <main className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <h1 className="text-2xl font-bold mb-4">Cardápio</h1>
        <ProductList products={mockProducts} />
        {/* <ProductList products={products} /> */}
      </div>
      <div
        className={`transition-all duration-300 ${
          cartItems.length > 0
            ? "border-2 border-blue-500 rounded-lg p-4 shadow-md"
            : "p-4"
        }`}
      >
        <OrderSummary items={cartItems} />
      </div>
    </main>
  )
}
