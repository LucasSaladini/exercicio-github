"use client"

import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
})

export const metadata: Metadata = {
  title: "Pedido Express",
  description:
    "Sistema de pedidos rápido e inteligente para estabelecimentos locais"
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const [queryClient] = useState<QueryClient>(() => new QueryClient())

  return (
    <html
      lang="pt-BR"
      className="dark:bg-background"
      data-theme="system"
      suppressHydrationWarning
    >
      <body
        className={cn(
          "min-h-screen bg-background text-foreground antialiased transition-colors",
          geistSans.variable,
          geistMono.variable
        )}
      >
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster richColors position="top-center" duration={4000} />
          </ThemeProvider>

          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </body>
    </html>
  )
}
