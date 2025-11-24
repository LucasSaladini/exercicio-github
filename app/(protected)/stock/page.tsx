"use client"

import { useCallback, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type Product = {
  id: number
  name: string
  price: number
  stock_quantity: number
  min_stock_alert?: number
}

export default function StockPage() {
  const supabase = createClientComponentClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from("products").select("*")

    if (error) {
      toast.error("Erro ao carregar produtos", {
        description: (error as Error)?.message ?? "Erro inesperado"
      })
    } else {
      setProducts(data || [])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchProducts()

    const productSub = supabase
      .channel("public:products")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        (payload) => {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === payload.new.id ? { ...p, ...payload.new } : p
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(productSub)
    }
  }, [fetchProducts, supabase])

  async function updateStock(id: number, newQuantity: number) {
    if (!Number.isInteger(newQuantity) || newQuantity < 0) {
      toast.error("Quantidade inválida", {
        description: "Informe um número inteiro maior ou igual a 0"
      })
      return
    }

    const { error } = await supabase
      .from("products")
      .update({ stock_quantity: newQuantity })
      .eq("id", id)

    if (error) {
      toast.error("Erro ao atualizar estoque", {
        description: (error as Error)?.message ?? "Erro inesperado"
      })
    } else {
      toast.success("Estoque atualizado com sucesso", {
        description: "Alteração salva com sucesso"
      })

      fetchProducts()
    }
  }

  useEffect(() => {
    fetchProducts()

    const interval = setInterval(fetchProducts, 10000000)
    return () => clearInterval(interval)
  }, [fetchProducts])

  useEffect(() => {
    if (!loading && products.length > 0) {
      const lowStock = products.filter(
        (p) =>
          p.stock_quantity > 0 && p.stock_quantity <= (p.min_stock_alert ?? 5)
      )

      const outOfStock = products.filter((p) => p.stock_quantity === 0)

      if (lowStock.length > 0) {
        toast.warning(
          `Atenção! ${lowStock.length} produto(s) com estoque baixo`,
          { duration: 4000 }
        )
      }

      if (outOfStock.length > 0) {
        toast.error(`Atenção! ${outOfStock.length} produto(s) esgotado(s)`, {
          duration: 4000
        })
      }
    }
  }, [loading, products])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Controle de Estoque</h1>
      {loading ? (
        <p>Carregando produtos...</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th>Preço</th>
              <th>Estoque</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isLow = p.stock_quantity <= (p.min_stock_alert ?? 5)
              const isOut = p.stock_quantity == 0

              return (
                <tr key={p.id} className="border-b">
                  <td className="py-2">{p.name}</td>
                  <td>{p.stock_quantity}</td>
                  <td>
                    {isOut ? (
                      <Badge variant="destructive">Esgotado</Badge>
                    ) : isLow ? (
                      <Badge variant="secondary">Baixo</Badge>
                    ) : (
                      <Badge variant="default">OK</Badge>
                    )}
                  </td>
                  <td>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newQuantity = prompt(
                          `Nova quantidade para ${p.name}: `,
                          String(p.stock_quantity)
                        )
                        if (newQuantity !== null) {
                          updateStock(p.id, parseInt(newQuantity))
                        }
                      }}
                    >
                      Atualizar
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
