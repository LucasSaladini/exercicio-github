import { NextRequest, NextResponse } from "next/server"

interface Product {
  id: string
  name: string
  price: number
  description: string
  stock_quantity: number
}

const products: Product[] = [
  { id: "1", name: "Produto 1", price: 10, description: "Desc 1", stock_quantity: 5 },
  { id: "2", name: "Produto 2", price: 20, description: "Desc 2", stock_quantity: 3 },
]

export async function GET(req: NextRequest) {
  return NextResponse.json(products)
}
