'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, Pencil } from 'lucide-react'

const links = [
  { href: '/compress', label: 'Compress', icon: Zap },
  { href: '/edit', label: 'Edit', icon: Pencil },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
              active ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${active ? 'bg-primary/10' : ''}`}>
              <Icon className="h-4 w-4" />
            </span>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
