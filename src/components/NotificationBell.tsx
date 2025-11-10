"use client"
import { useNotificationsStore } from "@/store/notificationsStore"
import { FaBell } from "react-icons/fa"

export default function NotificationBell() {
    const { newOrdersCount, reset } = useNotificationsStore()

    return (
        <div className="relative cursor-pointer" onClick={reset}>
            <FaBell size={24} />
            {newOrdersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {newOrdersCount}
                </span>
            )}
        </div>
    )
}