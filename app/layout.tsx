import type { Metadata } from "next"
import ClientLayout from "./ClientLayout"

export const metadata: Metadata = {
  title: {
    default: "Pedido Express",
    template: "%s — Pedido Express"
  },
  description:
    "Sistema moderno e rápido para gestão de pedidos, vendas e relatórios profissionais.",
  applicationName: "Pedido Express",
  generator: "Next.js",
  authors: [{ name: "Pedido Express" }],
  keywords: [
    "gestão de pedidos",
    "vendas",
    "relatórios",
    "dashboard",
    "pedido express"
  ],
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" }
  ],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  },
  manifest: "/manifest.json",

  openGraph: {
    title: "Pedido Express",
    description:
      "Gerencie pedidos e visualize relatórios de forma simples e eficiente.",
    url: "https://pedidoexpress.com",
    siteName: "Pedido Express",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630
      }
    ],
    locale: "pt_BR",
    type: "website"
  },

  twitter: {
    card: "summary_large_image",
    title: "Pedido Express",
    description: "Sistema moderno de gestão de pedidos.",
    images: ["/og-image.png"]
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
