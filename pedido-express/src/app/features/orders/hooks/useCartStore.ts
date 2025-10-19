import { create } from "zustand"
import { CartItem, Product } from "../types"

interface CartState {
    items: CartItem[];
    addItem: (product: Product, observation?: string) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    addItem: (product, observation) => {
        const existing = get().items.find((i) => i.id === product.id);
        if (existing) {
            set({
                items: get().items.map((i) =>
                    i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
                ),
            });
        } else {
            set({
                items: [...get().items, { ...product, quantity: 1, observation }],
            });
        }
    },
    removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
    updateQuantity: (id, quantity) =>
        set({
            items: get().items.map((i) =>
                i.id === id ? { ...i, quantity } : i
            ),
        }),
    clearCart: () => set({ items: [] }),
    get total() {
        return get().items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
    },
}));