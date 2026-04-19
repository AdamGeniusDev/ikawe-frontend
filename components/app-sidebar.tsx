"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  LayoutDashboard,
  CheckSquare,
  Database,
  PenTool,
  Users,
  Settings,
  Search,
  Bell,
  X,
  CheckCheck,
  ChevronRight,
  PlusCircle,
  type LucideIcon,
  BookOpen,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

interface MenuItemProps {
  title: string
  icon: LucideIcon
  url: string
}

const topMenuItems: MenuItemProps[] = [
  { title: "Dashboard",  icon: LayoutDashboard, url: "/dashboard" },
  { title: "Mes tâches", icon: CheckSquare,     url: "/tasks"     },
]

const datasetSubItems: MenuItemProps[] = [
  { title: "Bibliothèques", icon: BookOpen,       url: "/datasets"     },
  { title: "Annoter",      icon: PenTool,    url: "/annotate"     },
  { title: "Ajouter",      icon: PlusCircle, url: "/datasets/upload" },
]

const bottomMenuItems: MenuItemProps[] = [
  { title: "Collaborateurs", icon: Users,    url: "/collaborators" },
  { title: "Paramètres",     icon: Settings, url: "/settings"      },
]

const notifications = [
  {
    id: 1,
    title: "Nouvelle tâche assignée",
    description: "Marie vous a assigné la tâche « Annotation dataset vol.3 »",
    time: "Il y a 5 min",
    read: false,
  },
  {
    id: 2,
    title: "Dataset mis à jour",
    description: "Le dataset « Langues africaines v2 » a été mis à jour.",
    time: "Il y a 1h",
    read: false,
  },
  {
    id: 3,
    title: "Nouveau collaborateur",
    description: "Kofi Mensah a rejoint votre espace de travail.",
    time: "Hier",
    read: true,
  },
  {
    id: 4,
    title: "Export terminé",
    description: "Votre export du dataset « Swahili corpus » est prêt.",
    time: "Il y a 2 jours",
    read: true,
  },
]

export function AppSidebar() {
  const [query, setQuery] = useState<string>("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState(notifications)
  const [datasetsOpen, setDatasetsOpen] = useState(true)

  const unreadCount = notifs.filter((n) => !n.read).length

  const allMenuItems = [...topMenuItems, ...datasetSubItems, ...bottomMenuItems]
  const filteredItems = allMenuItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  )

  const markAllRead = () =>
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))

  return (
    <>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rechercher</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 border rounded-md px-3 py-2">
            <Search size={16} className="text-muted-foreground" />
            <input
              autoFocus
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Rechercher une page, un dataset…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery("")}>
                <X size={14} className="text-muted-foreground" />
              </button>
            )}
          </div>
          <ul className="mt-2 space-y-1">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <li key={item.url}>
                  <Link
                    href={item.url}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <item.icon size={16} className="text-muted-foreground" />
                    {item.title}
                  </Link>
                </li>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun résultat pour « {query} »
              </p>
            )}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex-row items-center justify-between space-y-0 pt-5">
            <DialogTitle>Notifications</DialogTitle>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <CheckCheck size={14} />
                Tout marquer comme lu
              </button>
            )}
          </DialogHeader>
          <ul className="divide-y">
            {notifs.map((n) => (
              <li
                key={n.id}
                className={`py-3 px-1 flex items-start gap-3 ${
                  !n.read ? "opacity-100" : "opacity-60"
                }`}
              >
                <span
                  className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                    !n.read ? "bg-primary" : "bg-transparent"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {n.description}
                  </p>
                  <span className="text-[11px] text-muted-foreground/70 mt-1 block">
                    {n.time}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <Sidebar>
        <SidebarHeader className="border-b px-4 py-3">
          <div className="flex flex-col items-start gap-3 pt-3">
            <Link href="/dashboard" aria-label="Retour à l'accueil Ikawe">
              <Image
                src="/assets/logo.svg"
                alt="Logo Ikawe"
                width={140}
                height={40}
                priority
                className="h-auto w-25"
              />
            </Link>
            <p className="text-[12px] font-normal text-muted-foreground">
              Plateforme de données africaines
            </p>
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex w-full items-center gap-2 bg-muted/50 hover:bg-white border border-transparent hover:border-border px-3 py-2 rounded-md my-1 text-muted-foreground hover:text-foreground transition-all cursor-text"
          >
            <Search size={16} />
            <span className="text-sm">Rechercher…</span>
          </button>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>

                {topMenuItems.map((item) => (
                  <SidebarMenuItem key={item.url} className="py-2">
                    <SidebarMenuButton asChild>
                      <a href={item.url} className="flex items-center gap-4 p-4">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                <div className="my-1 border-border/50" />

                <Collapsible open={datasetsOpen} onOpenChange={setDatasetsOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="flex items-center gap-4 p-4 w-full">
                        <Database className="h-4 w-4" />
                        <span className="flex-1">Datasets</span>
                        <ChevronRight
                          className={`h-4 w-4 transition-transform duration-200 ${
                            datasetsOpen ? "rotate-90" : ""
                          }`}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {datasetSubItems.map((item) => (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton asChild>
                              <a href={item.url} className="flex items-center gap-3">
                                <item.icon className="h-3.5 w-3.5" />
                                <span>{item.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>

                <div className="my-1 border-border/50" />

                {bottomMenuItems.map((item) => (
                  <SidebarMenuItem key={item.url} className="py-2">
                    <SidebarMenuButton asChild>
                      <a href={item.url} className="flex items-center gap-4 p-4">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t px-4 py-3">
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-medium text-foreground truncate">Jean Dupont</span>
                <span className="text-xs truncate">jean@example.com</span>
              </div>
            </div>
            <button
              onClick={() => setNotifOpen(true)}
              className="relative shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-secondary">
                  {unreadCount}
                </Badge>
              )}
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}