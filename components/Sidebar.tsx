'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { PanelLeft, Zap, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const links = [
  { href: '/compress', label: 'Compress', icon: Zap },
  { href: '/edit', label: 'Edit', icon: Pencil },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <TooltipProvider delay={0}>
      <aside
        className="hidden md:flex flex-col shrink-0 border-r border-border bg-card overflow-hidden transition-[width] duration-200 ease-in-out"
        style={{ width: collapsed ? 52 : 220 }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-2 py-3 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          <div
            className="flex items-center gap-2 overflow-hidden transition-opacity duration-100"
            style={{ opacity: collapsed ? 0 : 1, pointerEvents: collapsed ? 'none' : 'auto' }}
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              IW
            </div>
            <span className="text-sm font-bold text-foreground whitespace-nowrap">Image Worker</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-2 flex-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')

            const itemClasses = `relative flex items-center gap-2 rounded-lg p-1 transition-colors ${
              active
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`

            const itemContent = (
              <>
                {active && !collapsed && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary rounded-r-full" />
                )}
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
                    active ? 'bg-primary/20' : ''
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span
                  className="text-sm font-medium whitespace-nowrap overflow-hidden transition-opacity duration-100"
                  style={{ opacity: collapsed ? 0 : 1 }}
                >
                  {label}
                </span>
              </>
            )

            if (collapsed) {
              return (
                <Tooltip key={href}>
                  <TooltipTrigger render={<Link href={href} className={itemClasses} />}>
                    {itemContent}
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              )
            }

            return (
              <Link key={href} href={href} className={itemClasses}>
                {itemContent}
              </Link>
            )
          })}
        </nav>
      </aside>
    </TooltipProvider>
  )
}
