export interface Product {
    id: string;
    name: string;
    price: number;
    image_url?: string;
}

export interface CartItem extends Product {
    quantity: number;
    observation?: string;
}