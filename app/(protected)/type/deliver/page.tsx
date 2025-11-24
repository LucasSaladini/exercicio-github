export default async function DeliverOrdersPage() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orders?type=deliver`, {
        cache: "no-cache"
    })

    const orders = await res.json()

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Pedidos - Entrega</h1>
            {orders.length === 0 && (
                <p className="text-muted-foreground">Nenhum pedido de entrega</p>
            )}

            <div className="grid gap-4">
                {orders.map((order: any) => (
                    <div key={order.id} className="border rounded-lg p-4 shadow-sm">
                        <p><strong>ID:</strong> {order.id}</p>
                        <p><strong>Cliente:</strong> {order.customer_name}</p>
                        <p><strong>Status:</strong> {order.status}</p>
                        <p><strong>Tipo:</strong> Entrega</p>
                        <p><strong>Total:</strong> R$ {order.total}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
