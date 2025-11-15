import { getUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function InProgressOrderPage() {
    const user = await getUser()
    
    if (!user) {
        return redirect("/(auth)/login")
    }

    if(user.role !== "atendant") {
        return redirect("/(protected)/menu")
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orders?status=in-progress`, {
        cache: "no-store"
    })

    const orders = await res.json()

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Pedidos em Andamento</h1>
            {orders.length === 0 && (
                <p className="text-muted-foreground">Nenhum pedido em andamento</p>
            )}
            <div className="grid gap-4">
                {orders.map((order: any) => {
                    <div key={order.id} className="border rounded-lg p-4 shadow-sm">
                        <p><strong>ID:</strong>{order.id}</p>
                        <p><strong>Cliente:</strong>{order.customer_name}</p>
                        <p><strong>Status:</strong>{order.status}</p>
                        <p><strong>Total:</strong>R$ {order.total}</p>
                    </div>
                })}
            </div>
        </div>
    )
}