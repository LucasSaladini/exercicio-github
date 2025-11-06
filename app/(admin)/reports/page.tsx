"use client"

import { useEffect, useState, useCallback } from "react"
import { FileDown, FileText } from "lucide-react"
import { jsPDF } from "jspdf"
import Papa from "papaparse"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent
} from "@/components/ui/select"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

type ReportItem = {
  productId: string
  productName: string
  totalSales: number
  totalRevenue: number
  avgRating: number
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [productId, setProductId] = useState("")
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])

  const fetchReports = useCallback(async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams()

      if (startDate) {
        params.append("startDate", startDate)
      }

      if (endDate) {
        params.append("endDate", endDate)
      }

      if (productId) {
        params.append("productId", productId)
      }

      const res = await fetch(`/api/reports?${params.toString()}`)
      const json = await res.json()

      setData(json.report || [])
    } catch (error) {
      toast.error(String(error))
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, productId])

  useEffect(() => {
    fetchReports()
    fetchProducts()
  }, [fetchReports])

  async function fetchProducts() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("products")
      .select("id, name")
      .order("name", { ascending: true })

    if (!error && data) {
      setProducts(data)
    }
  }

  const exportCSV = () => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const link = document.createElement("a")

    link.href = URL.createObjectURL(blob)
    link.download = "relatorio_de_vendas_e_avaliacoes.csv"
    link.click()
  }

  const exportPDF = () => {
    const doc = new jsPDF()

    doc.text("Relatório de Vendas e Avaliações", 10, 10)

    let y = 20

    data.forEach((item) => {
      doc.text(
        `${item.productName} - Vendas: ${
          item.totalSales
        } | Faturamento: ${item.totalRevenue.toFixed(
          2
        )} | Avaliação: ${item.avgRating.toFixed(1)}`,
        10,
        y
      )
      y += 10
    })

    doc.save("relatorio_de_vendas_e_avaliacoes.pdf")
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Relatório</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div>
            <Label className="block text-sm mb-1">Data Inicial</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label className="block text-sm mb-1">Data Final</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <Label className="block text-sm mb-1">Produto</Label>
            <Select onValueChange={(v) => setProductId(v)}>
              <SelectTrigger className="w-[200px">
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchReports} disabled={loading}>
            {loading ? "Carregando" : "Filtrar"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Relatório de Vendas e Avaliações</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <FileText className="w-4 h-4 mr-2" /> CSV
            </Button>
            <Button variant="outline" onClick={exportPDF}>
              <FileDown className="w-4 h-4 mr-2" /> PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum dado encontrado
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalSales" name="Vendas" />
                <Bar dataKey="totalRevenue" name="Faturamento" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
