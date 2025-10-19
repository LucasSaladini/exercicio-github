import { ProductList } from "./components/ProductList"
import { OrderSummary } from "./components/OrderSummary"

const mockProduts = [
  { id: "1", name: "Hamburguer", price: 20 },
  { id: "2", name: "Batata Frita", price: 10 },
  { id: "3", name: "Refrigerante", price: 8 }
]

export default function OrdersPage() {
  return (
    <main className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <h1 className="text-2xl font-bold mb-4">Cardápio</h1>
        <ProductList products={mockProduts} />
      </div>
      <div>
        <OrderSummary items={[]} />
      </div>
    </main>
  )
}
