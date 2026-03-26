'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/compress', label: 'Compress' },
  { href: '/edit', label: 'Edit' },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-48 shrink-0 border-r border-neutral-200 min-h-screen p-4 flex flex-col gap-1">
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
        Image Worker
      </p>
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
            pathname.startsWith(href)
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          {label}
        </Link>
      ))}
    </aside>
  )
}
