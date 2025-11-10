import { useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useNotificationsStore } from "@/store/notificationsStore"
import { toast } from "sonner"

export function useOrderNotification() {
    const supabase = createClientComponentClient()
    const { increment } = useNotificationsStore()

    useEffect(() => {
        const channel = supabase.channel("orders-realtime")
                        .on("postgres_changes", 
                            { event: "INSERT", schema: "public", table: "orders"}, 
                            (payload) => { 
                                increment()
                                toast(`Novo pedido de ${payload.new.customer_name}`)
                            })
                            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, increment])
}