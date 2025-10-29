"use client"

import { useCallback, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { toast } from "sonner"
import { Product } from "@/app/features/orders/types"
import ProductDialog from "./ProductDialog"
import Image from "next/image"

export default function ProductsPage() {
  const supabase = createClientComponentClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })

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

    const channel = supabase
      .channel("products-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchProducts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchProducts, supabase])

  function handleNewProduct() {
    setSelectedProduct(null)
    setDialogOpen(true)
  }

  function handleEdit(product: Product) {
    setSelectedProduct(product)
    setDialogOpen(true)
  }

  async function handleDelete(productId: string) {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)

    if (error) {
      toast.error("Erro ao excluir produto", {
        description: (error as Error)?.message ?? "Erro inesperado"
      })
    } else {
      toast.success("Produto excluído com sucesso")

      fetchProducts()
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>
        <Button onClick={handleNewProduct}>Novo Produto</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando...</p>
          ) : products.length === 0 ? (
            <p>Nenhum produto cadastrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-xs text-gray-400">
                          Sem imagem
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {product.description}
                    </TableCell>
                    <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.stock_quantity}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(product)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(product.id.toString())}
                      >
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct || undefined}
        onSuccess={fetchProducts}
      />
    </div>
  )
}
