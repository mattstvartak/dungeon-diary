import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

export interface BreadcrumbItem {
  label: string
  href?: string
  isCurrentPage?: boolean
  isLoading?: boolean
}

export function generateBreadcrumbs(
  pathname: string,
  entityNames?: Record<string, string>
): BreadcrumbItem[] {
  // Always start with Home
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/app/dashboard' }
  ]

  // Remove /app prefix and split by /
  const pathWithoutApp = pathname.replace(/^\/app\/?/, '')

  if (!pathWithoutApp || pathWithoutApp === 'dashboard') {
    breadcrumbs.push({ label: 'Dashboard', isCurrentPage: true })
    return breadcrumbs
  }

  const segments = pathWithoutApp.split('/').filter(Boolean)

  // Build breadcrumbs from path segments
  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1
    const href = `/app/${segments.slice(0, index + 1).join('/')}`

    // Check if this segment looks like a UUID or ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
    const isNumericId = /^\d+$/.test(segment)

    let label = segment

    let isLoading = false

    if (isUUID || isNumericId) {
      // Try to get the name from entityNames map
      const entityKey = segments.slice(0, index + 1).join('/')
      const foundName = entityNames?.[entityKey] || entityNames?.[segment]

      if (foundName) {
        label = foundName
      } else {
        label = 'Loading...'
        isLoading = true
      }
    } else {
      // Capitalize and format segment
      label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      // Handle special cases
      if (segment === 'npcs') label = 'NPCs'
      if (segment === 'npc-generator') label = 'NPC Generator'
    }

    breadcrumbs.push({
      label,
      href: isLast ? undefined : href,
      isCurrentPage: isLast,
      isLoading
    })
  })

  return breadcrumbs
}
