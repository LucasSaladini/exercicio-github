import { create } from "zustand"
import { Product } from "@/app/features/orders/types"

export interface CartItem extends Product {
  id: string
  quantity: number
  observation?: string
}

interface CartState {
  items: CartItem[]
  total: number
  fetchCart: () => Promise<void>
  addItem: (product: Product, observation?: string) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateQuantity: (id: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  get total() {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  fetchCart: async () => {
    const res = await fetch("/api/cart")
    if (res.ok) {
      const data = await res.json()
      set({ items: data })
    }
  },

  addItem: async (product, observation) => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id, quantity: 1, observation }),
    })
    if (res.ok) {
      await get().fetchCart()
    }
  },

  removeItem: async (id) => {
    const res = await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      await get().fetchCart()
    }
  },

  updateQuantity: async (id, quantity) => {
    const res = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, quantity }),
    })
    if (res.ok) {
      await get().fetchCart()
    }
  },

  clearCart: async () => {
    const res = await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    if (res.ok) {
      set({ items: [] })
    }
  },
}))
