export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string;
    stock_quantity: number;
    created_at: string;
    updated_at: string;
}

export interface CartItem extends Product {
    quantity: number;
    observation?: string;
}