import { create } from "zustand"

interface OrderState {
    orderId: string | null
    setOrderId: (id: string | null) => void
}

export const useOrderStore = create<OrderState>((set) => ({
    orderId: null,
    setOrderId: (id) => set({ orderId: id }),
}))