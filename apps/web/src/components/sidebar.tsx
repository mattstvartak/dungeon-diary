'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  {
    name: 'Dashboard',
    href: '/app/dashboard',
    icon: '📊',
  },
  {
    name: 'Campaigns',
    href: '/app/campaigns',
    icon: '🎲',
  },
  {
    name: 'Sessions',
    href: '/app/sessions',
    icon: '🎙️',
  },
  {
    name: 'Settings',
    href: '/app/settings',
    icon: '⚙️',
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col lg:bg-card lg:pt-20">
      <div className="flex flex-col gap-y-5 overflow-y-auto px-6 py-8">
        {/* Navigation Links */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 transition-all',
                      isActive
                        ? 'bg-gradient-to-r from-primary/20 to-transparent text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card-hover'
                    )}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Subscription Info */}
        <div className="mt-auto">
          <div className="rounded-xl bg-gradient-to-r from-primary to-primary-soft p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl">✨</div>
              <div>
                <p className="text-sm font-semibold text-foreground">Free Plan</p>
                <p className="text-xs text-muted-foreground">3 sessions left this month</p>
              </div>
            </div>
            <Link href="/app/settings/billing">
              <button className="w-full text-sm bg-gradient-to-r from-primary to-primary text-foreground rounded-lg px-4 py-2 font-semibold transition-all">
                Upgrade to Premium
              </button>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
