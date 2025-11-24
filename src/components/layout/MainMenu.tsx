"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet"
import { Button } from "../ui/button"
import { Menu, ChevronDown, FileText } from "lucide-react"

interface MenuItem {
  label: string
  href?: string
  submenu?: MenuItem[]
}

export default function MainMenu() {
  const pathname = usePathname()
  const [openDesktop, setOpenDesktop] = useState<number | null>(null)
  const [openMobile, setOpenMobile] = useState<number | null>(null)

  const menuItems: MenuItem[] = [
    {
      label: "Pedidos",
      submenu: [
        { label: "Todos os Pedidos", href: "/orders" },
        { label: "Pedidos em Andamento", href: "/in-progress" },
        { label: "Checkout", href: "/checkout" },
        { label: "Carrinho", href: "/cart" },
      ],
    },
    { label: "Realizar Pedido", href: "/features/orders" },
    { label: "Produtos", href: "/products" },
    { label: "Estoque", href: "/stock" },
    {
      label: "Admin",
      submenu: [
        { label: "Usuários", href: "/users" },
        { label: "Relatórios", href: "/reports" },
      ],
    },
  ]

  const NavLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`px-4 py-2 rounded-md hover:bg-primary/10 block ${
        pathname?.startsWith(href) ? "font-bold text-primary" : ""
      }`}
    >
      {label}
    </Link>
  )

  const renderSubmenu = (submenu: MenuItem[]) => (
    <div className="absolute mt-2 bg-black shadow-md border rounded-md py-2 z-30">
      {submenu.map((sub, i) => (
        <div key={i} className="px-2 relative group">
          {!sub.submenu && sub.href && NavLink(sub.href, sub.label)}
          {sub.submenu && (
            <>
              <button className="flex items-center justify-between px-4 py-2 w-full hover:bg-primary/10 rounded-md text-left">
                {sub.label}
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute left-full top-0 ml-2 bg-black shadow-md border rounded-md py-2 hidden group-hover:block">
                {sub.submenu.map((deep, k) => (
                  <div key={k} className="px-2">
                    {NavLink(deep.href!, deep.label)}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <header className="w-full bg-black shadow-sm border-b">
      <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
        <div className="font-semibold text-lg">Pedido Express</div>

        <nav className="hidden md:flex gap-6 relative">
          {menuItems.map((item, i) => {
            const isOpen = openDesktop === i
            if (!item.submenu && item.href) return <div key={i}>{NavLink(item.href, item.label)}</div>

            return (
              <div
                key={i}
                className="relative"
                onMouseEnter={() => setOpenDesktop(i)}
                onMouseLeave={() => setOpenDesktop(null)}
              >
                <button className="flex items-center gap-1 px-4 py-2 hover:bg-primary/10 rounded-md">
                  {item.label}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {isOpen && item.submenu && renderSubmenu(item.submenu)}
              </div>
            )
          })}
        </nav>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="flex flex-col gap-4 mt-6">
                {menuItems.map((item, i) => {
                  const isOpen = openMobile === i
                  if (!item.submenu && item.href) return <div key={i}>{NavLink(item.href, item.label)}</div>

                  return (
                    <div key={i}>
                      <button
                        onClick={() => setOpenMobile(isOpen ? null : i)}
                        className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-primary/10 w-full text-left"
                      >
                        {item.label}
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {isOpen && item.submenu && (
                        <div className="ml-4 mt-2 flex flex-col gap-2">
                          {item.submenu.map((sub, j) => {
                            if (!sub.submenu && sub.href) return <div key={j}>{NavLink(sub.href, sub.label)}</div>

                            return (
                              <div key={j}>
                                <div className="font-medium px-2 py-1">{sub.label}</div>
                                <div className="ml-3 border-l pl-3 flex flex-col">
                                  {sub.submenu!.map((deep, k) => (
                                    <div key={k}>{NavLink(deep.href!, deep.label)}</div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
