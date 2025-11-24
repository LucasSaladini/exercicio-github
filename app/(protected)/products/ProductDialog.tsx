"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"
import { updateOptions } from "recharts/types/state/rootPropsSlice"

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  product?: {
    id: string | number
    name: string
    description: string
    price: number
    stock_quantity: number
    image_url?: string
  }
}

export default function ProductDialog({
  open,
  onOpenChange,
  onSuccess,
  product
}: ProductDialogProps) {
  const supabase = createClientComponentClient()
  const isEditing = !!product

  const [name, setName] = useState(product?.name ?? "")
  const [description, setDescription] = useState(product?.description ?? "")
  const [price, setPrice] = useState(product?.price?.toString() ?? "")
  const [stockQuantity, setStockQuantity] = useState(product?.stock_quantity?.toString() ?? "")
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)

  async function handleSave() {
    if (!name || !price || !stockQuantity) {
      toast.error("Preencha todos os campos");
      return;
    }
  
    const payload = {
      name,
      description,
      price: Number(price),
      stock_quantity: Number(stockQuantity),
      image_url: imageUrl || null,
      updated_at: new Date().toISOString(),
    };
  
    const { error } = isEditing
      ? await supabase.from("products").update(payload).eq("id", product!.id)
      : await supabase
          .from("products")
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          });
  
    if (error) {
      toast.error("Erro ao salvar produto", { description: error.message });
    } else {
      toast.success(isEditing ? "Produto atualizado" : "Produto criado");
      onSuccess();
      onOpenChange(false);
    }
  }
  
  useEffect(() => {
    if (open) {
      setName(product?.name ?? "")
      setDescription(product?.description ?? "")
      setPrice(product?.price?.toString() ?? "")
      setStockQuantity(product?.stock_quantity?.toString() ?? "")
      setImageUrl(product?.image_url ?? "")
      setUploading(false)
      setUploadProgress(0)
      setUploadStatus(null)
    }
  }, [open, product])

  const handleUpload = async (file: File) => {
    try {
      setUploading(true)
      setUploadProgress(0)
      setUploadStatus("Enviando imagem...")

      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { data: signedData, error: signedError } = await supabase.storage
        .from("product-images")
        .createSignedUploadUrl(filePath)

      if (signedError || !signedData) throw new Error(signedError?.message || "Erro ao gerar URL de upload.")

      const { signedUrl } = signedData

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("PUT", signedUrl, true)
        xhr.setRequestHeader("Content-Type", file.type)

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100))
          }
        }

        xhr.onload = () => xhr.status === 200 ? resolve() : reject(new Error("Falha no upload."))
        xhr.onerror = () => reject(new Error("Erro de rede durante o upload."))
        xhr.send(file)
      })

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath)

      setImageUrl(publicUrlData.publicUrl)
      setUploadStatus("Upload concluído com sucesso!")
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error("Erro ao enviar imagem", { description: error.message })
      }
      setUploadProgress(0)
      setUploading(false)
      setUploadStatus(null)
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    if (uploadStatus) {
      const timer = setTimeout(() => setUploadStatus(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [uploadStatus])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <Label>Preço (R$)</Label>
            <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>

          <div>
            <Label>Quantidade em estoque</Label>
            <Input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} />
          </div>

          <div>
            <Label>Imagem</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
              }}
              disabled={uploading}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploadProgress > 0 && <Progress value={uploadProgress} className="h-2" />}
            {uploadStatus && (
              <p className={`text-sm ${uploadStatus.includes("Erro") ? "text-red-500" : "text-green-500"}`}>
                {uploadStatus}
              </p>
            )}
            {imageUrl && (
              <Image
                src={imageUrl}
                alt="preview"
                className="mt-2 h-24 w-24 rounded-md object-cover border"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={uploading}>
            {isEditing ? "Salvar alterações" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
