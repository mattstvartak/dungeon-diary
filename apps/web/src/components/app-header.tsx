'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export interface BreadcrumbItemType {
  label: string
  href?: string
  isCurrentPage?: boolean
  isLoading?: boolean
}

interface AppHeaderProps {
  breadcrumbs?: BreadcrumbItemType[]
  actions?: React.ReactNode
}

export function AppHeader({ breadcrumbs, actions }: AppHeaderProps) {
  return (
    <header className="bg-card sticky top-0 z-50 border-b">
      <div className="flex items-center justify-between gap-6 px-4 py-2 sm:px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="[&_svg]:!size-5" />
          <Separator orientation="vertical" className="hidden !h-4 sm:block" />

          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumb className="hidden sm:block">
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <div key={index} className="contents">
                    <BreadcrumbItem>
                      {item.isLoading ? (
                        <Skeleton className="h-4 w-24" />
                      ) : item.isCurrentPage ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={item.href || '#'}>
                          {item.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-1.5">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
