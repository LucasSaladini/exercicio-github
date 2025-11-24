"use client"

import MainMenu from "@/components/layout/MainMenu"

export default function PublicLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <MainMenu />
      <main className="flex-1">{children}</main>
    </div>
  )
}
