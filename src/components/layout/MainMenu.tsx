"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet"
import { Button } from "../ui/button"
import { Menu, ChevronDown, User } from "lucide-react"

interface MenuItem {
  label: string
  href?: string
  submenu?: MenuItem[]
}

interface MainMenuProps {
  role: "admin" | "atendant" | "customer"
}

export default function MainMenu({ role }: MainMenuProps) {
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  const [openDesktop, setOpenDesktop] = useState<number | null>(null)
  const [openMobile, setOpenMobile] = useState<number | null>(null)

  const getMenuItems = (): MenuItem[] => {
    if (role === "customer") {
      return [
        {
          label: "Pedidos",
          submenu: [
            { label: "Realizar Pedido", href: "/(protected)/menu" },
            { label: "Meus Pedidos", href: "/(protected)/orders" },
          ],
        },
        { label: "Produtos", href: "/(protected)/products" },
        { label: "Configurações", href: "/settings" },
      ]
    }

    if (role === "atendant") {
      return [
        { label: "Pedidos em Andamento", href: "/(protected)/in-progress" },
        { label: "Clientes", href: "/customers" },
        { label: "Produtos", href: "/(protected)/products" },
        { label: "Configurações", href: "/settings" },
      ]
    }

    return [
        {
          label: "Pedidos",
          submenu: [
            { label: "Todos os Pedidos", href: "/(protected)/orders" },
            {
              label: "Pedidos por Tipo",
              submenu: [
                { label: "Entrega", href: "/(protected)/type/deliver" },
                { label: "Retirada", href: "/(protected)/type/take" },
              ],
            },
          ],
        },
        { label: "Clientes", href: "/customers" },
        { label: "Produtos", href: "/products" },
        { label: "Relatórios", href: "/reports" },
        { label: "Configurações", href: "/settings" },
      ]
    }

  const items = getMenuItems()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const NavLink = (href: string, label: string) => {
    return (
      <Link
        href={href}
        className={`px-4 py-2 rounded-md hover:bg-primary/10 transition block ${
          pathname?.startsWith(href) ? "font-bold text-primary" : ""
        }`}
      >
        {label}
      </Link>
    )
  }

  const renderSubmenu = (submenu: MenuItem[]) => {
    return (
      <div className="absolute mt-2 bg-white shadow-md border rounded-md py-2 z-30">
        {submenu.map((sub, i) => (
          <div key={i} className="px-2">
            {!sub.submenu && sub.href && NavLink(sub.href, sub.label)}
            {sub.submenu && (
              <div className="group relative">
                <button className="flex items-center justify-between px-4 py-2 w-full hover:bg-primary/10 rounded-md text-left">
                  {sub.label}
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute left-full top-0 ml-2 bg-white shadow-md border rounded-md py-2 hidden group-hover:block">
                  {sub.submenu.map((deep, k) => (
                    <div key={k} className="px-2">
                      {NavLink(deep.href!, deep.label)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <header className="w-full bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
        <div className="font-semibold text-lg">Pedido Express</div>
        <nav className="hidden md:flex gap-6 relative">
          {items.map((item, i) => {
            const isOpen = openDesktop === i

            if (!item.submenu && item.href) {
              return (
                <div key={i}>{NavLink(item.href, item.label)}</div>
              )
            }
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

                {isOpen && renderSubmenu(item.submenu!)}
              </div>
            )
          })}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <User className="w-5 h-5" />
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left">
              <nav className="flex flex-col gap-4 mt-6">

                {items.map((item, i) => {
                  const isOpen = openMobile === i

                  if (!item.submenu && item.href) {
                    return <div key={i}>{NavLink(item.href, item.label)}</div>
                  }

                  return (
                    <div key={i}>
                      <button
                        onClick={() =>
                          setOpenMobile(isOpen ? null : i)
                        }
                        className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-primary/10 w-full text-left"
                      >
                        {item.label}
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {isOpen && (
                        <div className="ml-4 mt-2 flex flex-col gap-2">
                          {item.submenu!.map((sub, j) => {
                            if (!sub.submenu && sub.href)
                              return <div key={j}>{NavLink(sub.href, sub.label)}</div>

                            return (
                              <div key={j}>
                                <div className="font-medium px-2 py-1">
                                  {sub.label}
                                </div>

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

              <div className="mt-8 border-t pt-4">
                <Button variant="outline" onClick={handleLogout} className="w-full">
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
