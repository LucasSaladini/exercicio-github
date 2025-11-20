"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"

type DeleteUserDialogProps = {
  user: { id: string; name: string }
  open: boolean
  onClose: () => void
  reload: () => void
}

export default function DeleteUserDialog({ user, open, onClose, reload }: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(false)

  const deleteUser = async () => {
    setLoading(true)

    const res = await fetch("/api/admin/users/delete", {
      method: "DELETE",
      body: JSON.stringify({ user_id: user.id }),
    })

    if (!res.ok) {
      toast.error("Erro ao excluir usuário")
    } else {
      toast.success("Usuário excluído!")
      reload()
      onClose()
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir usuário</DialogTitle>
        </DialogHeader>

        <p>Tem certeza que deseja excluir <b>{user.name}</b>?</p>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={deleteUser} disabled={loading}>
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
