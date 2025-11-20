"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState } from "react"
import { toast } from "sonner"

interface ChangeRoleDialogProps {
    user: { id: string; name: string }
    open: boolean
    onClose: () => void
    reload: () => void
}

export default function ChangeRoleDialog({ user, open, onClose, reload }: ChangeRoleDialogProps) {
    const supabase = createClientComponentClient()
    const [loading, setLoading] = useState(false)

    const changeRole = async (role: string) => {
        setLoading(true)

        const res = await fetch("/api/admin/user/update-role", {
            method: "PATCH",
            body: JSON.stringify({ user_id: user.id, role }),
        })

        if(!res.ok) {
            toast.error("Erro ao alterar o role")
        } else {
            toast.success("Role atualizado")
            reload()
            onClose()
        }

        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Alterar o role de {user.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <Button  onClick={() => changeRole("admin")} disabled={loading} className="w-full">Tornar Admin</Button>
                    <Button variant="secondary" onClick={() => changeRole("attendant")} disabled={loading} className="w-full">Tornar Atendente</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}