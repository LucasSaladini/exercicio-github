"use client"

import { useEffect, useState } from "react"
import { Download, FileDown, FileText } from "lucide-react"
import { jsPDF } from "jspdf"
import Papa from "papaparse"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
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

  async function fetchReports() {
    
  }
}