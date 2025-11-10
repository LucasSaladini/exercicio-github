import { create } from "zustand"

interface NotificationState {
    newOrdersCount: number;
    increment: () => void;
    reset: () => void;
}

export const useNotificationsStore = create<NotificationState>((set) => ({
    newOrdersCount: 0,
    increment: () => set((state) => ({ newOrdersCount: state.newOrdersCount + 1 })),
    reset: () => set({ newOrdersCount: 0 }),
}))