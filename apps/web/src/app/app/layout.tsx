'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppHeader } from '@/components/app-header'
import { HeaderUserMenu } from '@/components/header-user-menu'
import { useAuth } from '@/providers/auth-provider'
import { useRouter, usePathname } from 'next/navigation'
import { generateBreadcrumbs } from '@/lib/utils'
import { useBreadcrumbEntities } from '@/hooks/use-breadcrumb-entities'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const entityNames = useBreadcrumbEntities()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const breadcrumbs = generateBreadcrumbs(pathname, entityNames)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <AppHeader
            breadcrumbs={breadcrumbs}
            actions={
              user ? (
                <HeaderUserMenu
                  user={{
                    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                    email: user.email || '',
                    avatar: user.user_metadata?.avatar_url,
                  }}
                  onLogout={handleSignOut}
                />
              ) : null
            }
          />
          <main className="size-full flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
