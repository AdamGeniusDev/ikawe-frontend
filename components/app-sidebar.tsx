'use client'

import {
  Sidebar, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard, CheckSquare, PenTool,
  Users, Settings, Search, Bell,
  PlusCircle, BookOpen, ClipboardCheck,
  type LucideIcon,
} from 'lucide-react'
import Image   from 'next/image'
import Link    from 'next/link'
import { useState } from 'react'
import { usePathname }  from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SearchDialog, getShortcutLabel } from '@/components/layout/SearchDialog'
import { NotificationsDialog } from '@/components/layout/NotificationsDialog'
import { useNotifications }    from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'
import { CURRENT_USER, getUserById } from '@/constants/mock-data'
import { getAvatarProps } from '@/types/user'
import type { User, SessionUser } from '@/types/user'

// NavRole — projection UI servant uniquement à filtrer les entrées de menu.
// Dérivée du modèle de rôles canonique (platformRole + teamMemberships) via
// deriveNavRole(). Ce n'est PAS un type de rôle métier supplémentaire.
type NavRole = 'annotator' | 'reviewer' | 'admin'

interface MenuItemDef {
  title:  string
  icon:   LucideIcon
  url:    string
  roles?: NavRole[]
  exact?: boolean
}

const mainMenuItems: MenuItemDef[] = [
  { title: 'Dashboard',  icon: LayoutDashboard, url: '/dashboard', exact: true },
  { title: 'Mes tâches', icon: CheckSquare,     url: '/tasks',     roles: ['annotator', 'admin'] },
  { title: 'Révisions',  icon: ClipboardCheck,  url: '/reviews',   roles: ['reviewer',  'admin'] },
]

const dataMenuItems: MenuItemDef[] = [
  { title: 'Bibliothèques', icon: BookOpen,   url: '/datasets'         },
  { title: 'Annoter',       icon: PenTool,    url: '/annotate',        roles: ['annotator', 'admin'] },
  { title: 'Ajouter',       icon: PlusCircle, url: '/datasets/upload', roles: ['admin'] },
]

const accountMenuItems: MenuItemDef[] = [
  { title: 'Équipes',    icon: Users,    url: '/team'     },
  { title: 'Paramètres', icon: Settings, url: '/settings' },
]

// Dérive le rôle de navigation depuis le user canonique.
// team_owner / team_admin / admin plateforme → accès complet ('admin').
function deriveNavRole(session: SessionUser, full: User | undefined): NavRole {
  if (session.platformRole === 'admin') return 'admin'
  const roles = full?.teamMemberships.map(m => m.role) ?? []
  if (roles.includes('team_owner') || roles.includes('team_admin')) return 'admin'
  if (roles.includes('reviewer')) return 'reviewer'
  return 'annotator'
}

function filterByRole(items: MenuItemDef[], role: NavRole): MenuItemDef[] {
  return items.filter(item => !item.roles || item.roles.includes(role))
}

function resolveActiveUrl(items: MenuItemDef[], pathname: string): string | null {
  let best: string | null = null
  let bestLen = 0
  for (const item of items) {
    const matches = item.exact
      ? pathname === item.url
      : pathname === item.url || pathname.startsWith(item.url + '/')
    if (matches && item.url.length > bestLen) {
      best = item.url; bestLen = item.url.length
    }
  }
  return best
}

function NavItem({ item, isActive }: { item: MenuItemDef; isActive: boolean }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild data-active={isActive}>
        <Link href={item.url} className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 mx-1 text-sm transition-colors',
          isActive
            ? 'bg-secondary text-secondary-foreground font-semibold'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}>
          <item.icon className="h-4 w-4 shrink-0" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function MenuSection({ label, items, activeUrl }: {
  label?: string; items: MenuItemDef[]; activeUrl: string | null
}) {
  if (items.length === 0) return null
  return (
    <SidebarGroup className="px-2 py-1">
      {label && (
        <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {items.map(item => (
            <NavItem key={item.url} item={item} isActive={activeUrl === item.url} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const session  = CURRENT_USER
  const fullUser = getUserById(session.id)
  const navRole  = deriveNavRole(session, fullUser)
  const avatar   = getAvatarProps({ id: session.id, name: session.name, avatarUrl: session.avatarUrl })

  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen,  setNotifOpen]  = useState(false)
  const shortcutLabel = getShortcutLabel()

  const { notifs, markAllRead, unreadCount } = useNotifications()

  const visibleMain    = filterByRole(mainMenuItems,    navRole)
  const visibleData    = filterByRole(dataMenuItems,    navRole)
  const visibleAccount = filterByRole(accountMenuItems, navRole)
  const allItems       = [...visibleMain, ...visibleData, ...visibleAccount]
  const activeUrl      = resolveActiveUrl(allItems, pathname)

  return (
    <>
      
      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        items={allItems}
      />
      <NotificationsDialog
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifs={notifs}
        unreadCount={unreadCount}
        markAllRead={markAllRead}
      />

      <Sidebar>

        <SidebarHeader className="border-b px-4 py-4 gap-3">
          <Link href="/dashboard" aria-label="Retour à l'accueil Ikawe">
            <Image src="/assets/logo.svg" alt="Logo Ikawe" width={140} height={40} priority className="h-auto w-28" />
          </Link>
          <p className="text-[11px] text-muted-foreground leading-none">
            Plateforme de données africaines
          </p>

          {/* Bouton recherche — ouvre SearchDialog, affiche le raccourci détecté */}
          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg border border-border/60',
              'bg-muted/40 px-3 py-2 text-sm text-muted-foreground',
              'hover:border-border hover:bg-muted hover:text-foreground',
              'cursor-pointer transition-all group',
            )}
            aria-label="Ouvrir la recherche"
          >
            <Search size={13} className="shrink-0" />
            <span className="flex-1 text-left text-sm">Rechercher…</span>
            <kbd className={cn(
              'hidden sm:inline-flex items-center rounded border border-border/50',
              'bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/60',
              'group-hover:border-border group-hover:text-muted-foreground transition-colors',
            )}>
              {shortcutLabel}
            </kbd>
          </button>
        </SidebarHeader>

        <SidebarContent className="py-2 gap-0">
          <MenuSection items={visibleMain} activeUrl={activeUrl} />
          {visibleData.length > 0 && (
            <><div className="mx-4 my-1 border-t border-border/30" />
            <MenuSection label="Données" items={visibleData} activeUrl={activeUrl} /></>
          )}
          {visibleAccount.length > 0 && (
            <><div className="mx-4 my-1 border-t border-border/30" />
            <MenuSection label="Compte" items={visibleAccount} activeUrl={activeUrl} /></>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={avatar.avatarUrl} alt={session.name} />
                <AvatarFallback className="text-xs font-semibold bg-secondary text-secondary-foreground">
                  {avatar.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-[13px] font-medium text-foreground truncate">{session.name}</span>
                <span className="text-[11px] text-muted-foreground truncate">{session.email}</span>
              </div>
            </div>
            <button
              onClick={() => setNotifOpen(true)}
              className="relative shrink-0 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </SidebarFooter>

      </Sidebar>
    </>
  )
}