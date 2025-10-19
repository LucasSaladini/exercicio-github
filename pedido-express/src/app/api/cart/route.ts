import { createClient, getUser } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase.from('cart_items').select('*').eq('user_id', user.id)
    
    if (error) {
        return NextResponse.json({ error: error.message}, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(req: Request) {
    const supabase = await createClient()
    const user = await getUser()
    const { product_id, quantity } = await req.json()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase.from('cart_items')
                                            .insert([{ user_id: user.id, product_id, quantity }])
                                            .select()
                                            .single()

    if(error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function PATCH(req: Request) {
    const supabase = await createClient()
    const user = await getUser()
    const { id, quantity } = await req.json()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase.from('cart_items')
                                            .update({ quantity})
                                            .eq('id', id)
                                            .eq('user_id', user.id)
                                            .select()
                                            .single()

    if (error) {
        return NextResponse.json({ error: error.message}, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function DELETE(req: Request) {
    const supabase = await createClient()
    const user = await getUser()
    const { id } = await req.json()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized'}, { status: 401 })
    }

    let query = (await supabase).from('cart_items').delete().eq('user_id', user.id)

    if (id) {
    query = (await supabase)
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('id', id)
    }

    const { error } = await query

    if (error) {
        return NextResponse.json({ error: error.message}, { status: 500 })
    }

    return NextResponse.json({ success: true })
}