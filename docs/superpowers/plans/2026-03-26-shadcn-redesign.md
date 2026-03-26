# shadcn/ui Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Image Worker with a dark shadcn/ui UI: collapsible sidebar, large drop zone with indigo glow, clipboard paste support, and consistent dark theme across Compress and Edit pages.

**Architecture:** Replace all visual components in-place — same file paths, same props interfaces where possible, same logic. Install shadcn/ui via CLI (generates `components/ui/`), update CSS variables in `globals.css` for the dark palette, add `dark` class to `<html>`. No new routes or API changes.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui (Radix UI primitives), TypeScript, npm

> **Note on testing:** No test framework is configured in this project. Each task's verification step is "run `npm run dev` and visually confirm in the browser". Read `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md` before touching CSS — Tailwind v4 uses `@import "tailwindcss"` not `@tailwind` directives, and the config is CSS-first.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/globals.css` | Modify | Dark theme CSS variables for shadcn |
| `app/layout.tsx` | Modify | Add `dark` class to `<html>` |
| `components/ui/` | Create (generated) | shadcn primitive components — do not edit by hand |
| `components/Sidebar.tsx` | Replace | Collapsible sidebar with PanelLeft toggle |
| `components/compress/DropZone.tsx` | Replace | Dark styled drop zone with `flashing` prop |
| `components/compress/CompressPage.tsx` | Modify | Add clipboard paste listener |
| `components/compress/FormatOptions.tsx` | Replace | shadcn Select + Slider |
| `components/compress/JobRow.tsx` | Replace | Dark card row style |
| `components/edit/EditPage.tsx` | Modify | Add clipboard paste listener |
| `components/edit/ControlsPanel.tsx` | Replace | shadcn Select, Slider, Switch, Button |
| `components/edit/ImagePreview.tsx` | Replace | Dark styled preview + download button |

---

## Task 1: Install shadcn/ui and scaffold dark theme CSS variables

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Run shadcn init**

```bash
npx shadcn@latest init
```

When prompted, answer:
- Style → **New York**
- Base color → **Slate**
- CSS variables → **Yes**

This generates `components/ui/`, updates `package.json`, and writes base CSS variables into `app/globals.css`.

- [ ] **Step 2: Overwrite `app/globals.css` with dark palette**

Replace the entire file content with:

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 3%;
    --foreground: 0 0% 90%;
    --card: 0 0% 7%;
    --card-foreground: 0 0% 90%;
    --popover: 0 0% 7%;
    --popover-foreground: 0 0% 90%;
    --primary: 239 84% 67%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 10%;
    --secondary-foreground: 0 0% 70%;
    --muted: 0 0% 10%;
    --muted-foreground: 0 0% 45%;
    --accent: 239 84% 67%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 12%;
    --input: 0 0% 12%;
    --ring: 239 84% 67%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 0 0% 3%;
    --foreground: 0 0% 90%;
    --card: 0 0% 7%;
    --card-foreground: 0 0% 90%;
    --popover: 0 0% 7%;
    --popover-foreground: 0 0% 90%;
    --primary: 239 84% 67%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 10%;
    --secondary-foreground: 0 0% 70%;
    --muted: 0 0% 10%;
    --muted-foreground: 0 0% 45%;
    --accent: 239 84% 67%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 12%;
    --input: 0 0% 12%;
    --ring: 239 84% 67%;
  }
  * {
    border-color: hsl(var(--border));
  }
  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
  }
}
```

- [ ] **Step 3: Add `dark` class to `<html>` in layout**

Replace `app/layout.tsx` with:

```tsx
import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'

export const metadata: Metadata = { title: 'Image Worker' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen bg-background text-foreground antialiased">
        <Sidebar />
        <main className="flex-1 p-8">{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```

Expected: compiles without errors, browser shows dark background at `http://localhost:3000`.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx package.json package-lock.json components/ui/
git commit -m "feat: install shadcn/ui and configure dark theme"
```

---

## Task 2: Install shadcn component primitives

**Files:**
- Create: `components/ui/button.tsx`, `components/ui/tooltip.tsx`, `components/ui/select.tsx`, `components/ui/slider.tsx`, `components/ui/switch.tsx`, `components/ui/badge.tsx`

- [ ] **Step 1: Add components via CLI**

```bash
npx shadcn@latest add button tooltip select slider switch badge
```

Expected: each component file appears in `components/ui/`.

- [ ] **Step 2: Verify imports resolve**

```bash
npm run build 2>&1 | head -20
```

Expected: no TypeScript errors related to missing `@/components/ui/*` imports. (Build may fail on other things — only care about import errors here.)

- [ ] **Step 3: Commit**

```bash
git add components/ui/
git commit -m "feat: add shadcn button, tooltip, select, slider, switch, badge components"
```

---

## Task 3: Rebuild Sidebar with collapsible behaviour

**Files:**
- Replace: `components/Sidebar.tsx`

The sidebar manages its own collapsed state. When collapsed (52px), nav labels and wordmark fade out; when expanded (220px), they're visible. The PanelLeft icon sits at the top and toggles state. Collapsed nav items show tooltips on hover.

- [ ] **Step 1: Replace `components/Sidebar.tsx`**

```tsx
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
    <TooltipProvider delayDuration={0}>
      <aside
        className="flex flex-col shrink-0 border-r border-border bg-card overflow-hidden transition-[width] duration-200 ease-in-out"
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
            const navItem = (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-2 rounded-lg p-1 transition-colors ${
                  active
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
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
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              )
            }

            return navItem
          })}
        </nav>
      </aside>
    </TooltipProvider>
  )
}
```

- [ ] **Step 2: Install lucide-react (shadcn peer dep — may already be present)**

```bash
npm install lucide-react
```

Expected: resolves without error; if already installed, no-op.

- [ ] **Step 3: Verify in browser**

Run `npm run dev`. Open `http://localhost:3000/compress`. Confirm:
- Sidebar is dark, 220px wide, shows "Image Worker" wordmark and two nav links
- Clicking PanelLeft icon collapses to 52px — labels/wordmark fade, icons remain centered
- Hovering a nav icon in collapsed state shows a tooltip
- Active link has indigo highlight and left accent bar

- [ ] **Step 4: Commit**

```bash
git add components/Sidebar.tsx package.json package-lock.json
git commit -m "feat: collapsible dark sidebar with icon-only collapsed state"
```

---

## Task 4: Rebuild DropZone with dark style and flashing prop

**Files:**
- Replace: `components/compress/DropZone.tsx`

The new DropZone accepts a `flashing` prop. When true, it renders a ring highlight for 600ms (managed by the parent). The parent passes `flashing` after a clipboard paste.

- [ ] **Step 1: Replace `components/compress/DropZone.tsx`**

```tsx
'use client'

import { useRef, useState } from 'react'
import { MAX_FILE_BYTES } from '@/lib/api'
import { Upload } from 'lucide-react'

interface Props {
  onFiles: (files: File[]) => void
  disabled?: boolean
  flashing?: boolean
}

export function DropZone({ onFiles, disabled, flashing }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handle(files: FileList | null) {
    if (!files) return
    const valid = Array.from(files).filter((f) => {
      if (f.size > MAX_FILE_BYTES) {
        alert(`${f.name} exceeds 50MB limit`)
        return false
      }
      return true
    })
    if (valid.length) onFiles(valid)
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (!disabled) handle(e.dataTransfer.files)
      }}
      className={[
        'relative flex h-56 w-full max-w-2xl flex-col items-center justify-center gap-3',
        'rounded-2xl border-2 border-dashed transition-all duration-200 select-none',
        'cursor-pointer',
        dragging
          ? 'border-primary/60 scale-[1.01]'
          : 'border-primary/40 hover:border-primary/60',
        disabled ? 'opacity-50 pointer-events-none' : '',
        flashing ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : '',
      ].join(' ')}
      style={{
        background: dragging
          ? 'radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.12) 0%, transparent 70%)'
          : 'radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.06) 0%, transparent 70%)',
      }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Upload className="h-6 w-6 text-primary" />
      </div>
      <p className="text-base font-semibold text-foreground">Drop images here</p>
      <p className="text-sm text-muted-foreground text-center leading-relaxed">
        or <span className="text-primary">click to browse</span>
        {' · '}
        <span className="text-primary">paste from clipboard</span>
        <br />
        PNG, JPG, WEBP, AVIF · Max 50MB per file
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:3000/compress`. Confirm:
- Drop zone shows indigo dashed border with radial glow
- Dragging a file over it brightens the border and glow
- Clicking opens the file picker

- [ ] **Step 3: Commit**

```bash
git add components/compress/DropZone.tsx
git commit -m "feat: dark drop zone with indigo glow and flashing prop"
```

---

## Task 5: Add clipboard paste to CompressPage

**Files:**
- Modify: `components/compress/CompressPage.tsx`

- [ ] **Step 1: Replace `components/compress/CompressPage.tsx`**

```tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { compressFiles, downloadAllUrl, type JobEntry } from '@/lib/api'
import { DropZone } from './DropZone'
import { FormatOptions } from './FormatOptions'
import { JobRow } from './JobRow'

interface QueueItem extends JobEntry {
  done: boolean
}

export function CompressPage() {
  const [format, setFormat] = useState('')
  const [quality, setQuality] = useState(80)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [flashing, setFlashing] = useState(false)

  async function handleFiles(files: File[]) {
    setUploading(true)
    try {
      const { jobs } = await compressFiles(files, {
        format: format || undefined,
        quality,
      })
      setQueue((q) => [...q, ...jobs.map((j) => ({ ...j, done: false }))])
    } finally {
      setUploading(false)
    }
  }

  const handleDone = useCallback((id: string) => {
    setQueue((q) => q.map((item) => item.id === id ? { ...item, done: true } : item))
  }, [])

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items ?? [])
      const files = items
        .filter((i) => i.kind === 'file' && i.type.startsWith('image/'))
        .map((i) => i.getAsFile())
        .filter(Boolean) as File[]
      if (!files.length) return
      setFlashing(true)
      setTimeout(() => setFlashing(false), 600)
      handleFiles(files)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, quality])

  const doneJobIds = queue.filter((j) => !j.status && j.done).map((j) => j.id)

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="w-full max-w-2xl">
        <h1 className="text-xl font-semibold text-foreground mb-6">Compress</h1>

        <FormatOptions
          format={format}
          quality={quality}
          onFormat={setFormat}
          onQuality={setQuality}
        />
      </div>

      <DropZone onFiles={handleFiles} disabled={uploading} flashing={flashing} />

      {queue.length > 0 && (
        <div className="w-full max-w-2xl space-y-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs text-muted-foreground">
              {queue.length} file{queue.length !== 1 ? 's' : ''}
            </span>
            {doneJobIds.length > 0 && (
              <a
                href={downloadAllUrl(doneJobIds)}
                download
                className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                Download all ({doneJobIds.length})
              </a>
            )}
          </div>
          {queue.map((item) => (
            <JobRow
              key={item.id}
              id={item.id}
              filename={item.filename}
              initialStatus={item.status}
              onDone={handleDone}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify clipboard paste**

Open `http://localhost:3000/compress`. Copy an image to clipboard (screenshot, or copy image in browser). Press `Cmd+V` / `Ctrl+V`. Confirm:
- Drop zone briefly shows an indigo ring flash
- A new job appears in the queue below

- [ ] **Step 3: Commit**

```bash
git add components/compress/CompressPage.tsx
git commit -m "feat: clipboard paste support on compress page"
```

---

## Task 6: Rebuild FormatOptions with shadcn Select + Slider

**Files:**
- Replace: `components/compress/FormatOptions.tsx`

shadcn's `Select` uses `value`/`onValueChange` (not `onChange`). shadcn's `Slider` uses `value={[number]}`/`onValueChange={(v) => fn(v[0])}`.

- [ ] **Step 1: Replace `components/compress/FormatOptions.tsx`**

> shadcn `Select` doesn't support empty string `""` as a value. Use `'_original'` as the sentinel for "Keep original" and map it to `""` on the way out.

```tsx
'use client'

import { FORMATS, FORMAT_LABELS } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

interface Props {
  format: string
  quality: number
  onFormat: (f: string) => void
  onQuality: (q: number) => void
}

export function FormatOptions({ format, quality, onFormat, onQuality }: Props) {
  return (
    <div className="flex items-center gap-4 flex-wrap mb-6">
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Format</span>
        <Select
          value={format || '_original'}
          onValueChange={(v) => onFormat(v === '_original' ? '' : v)}
        >
          <SelectTrigger className="w-36 h-8 text-sm bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {FORMATS.map((f) => (
              <SelectItem key={f || '_original'} value={f || '_original'} className="text-sm">
                {FORMAT_LABELS[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Quality</span>
        <Slider
          min={1}
          max={100}
          step={1}
          value={[quality]}
          onValueChange={([v]) => onQuality(v)}
          className="w-28"
        />
        <span className="text-sm text-foreground w-7 text-right tabular-nums">{quality}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:3000/compress`. Confirm the Format dropdown and Quality slider render correctly with dark styling. Changing format or quality and dropping a file should use the selected values.

- [ ] **Step 3: Commit**

```bash
git add components/compress/FormatOptions.tsx
git commit -m "feat: format/quality controls with shadcn Select and Slider"
```

---

## Task 7: Restyle JobRow

**Files:**
- Replace: `components/compress/JobRow.tsx`

Same logic, dark card visual only.

- [ ] **Step 1: Replace `components/compress/JobRow.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { pollJob, downloadUrl, type JobRecord } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ImageIcon } from 'lucide-react'

interface Props {
  id: string
  filename: string
  initialStatus?: 'error'
  onDone?: (id: string) => void
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

function savings(before: number, after: number) {
  const pct = Math.round((1 - after / before) * 100)
  return pct > 0 ? `-${pct}%` : `+${Math.abs(pct)}%`
}

export function JobRow({ id, filename, initialStatus, onDone }: Props) {
  const [job, setJob] = useState<JobRecord | null>(null)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (initialStatus === 'error') return

    let cancelled = false
    let timerId: ReturnType<typeof setTimeout> | undefined

    async function tick() {
      const result = await pollJob(id)
      if (cancelled) return

      if (result === null) {
        setExpired(true)
        return
      }

      setJob((prev) => (prev?.status === result.status ? prev : result))

      if (result.status === 'done') {
        onDone?.(id)
        return
      }

      if (result.status !== 'error') {
        timerId = setTimeout(tick, 1000)
      }
    }

    tick()
    return () => {
      cancelled = true
      clearTimeout(timerId)
    }
  }, [id, initialStatus, onDone])

  if (initialStatus === 'error') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
        <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-foreground">{filename}</span>
        <Badge variant="destructive" className="text-xs">Unsupported format</Badge>
      </div>
    )
  }

  const status = expired ? 'expired' : (job?.status ?? 'processing')

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm hover:bg-secondary/30 transition-colors">
      <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate text-foreground">{filename}</span>

      {status === 'processing' && (
        <span className="text-xs text-primary animate-pulse">Processing…</span>
      )}

      {status === 'done' && job && (
        <>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatBytes(job.sizeBefore)} → {formatBytes(job.sizeAfter!)}
            <span className="ml-1.5 text-green-400 font-medium">
              {savings(job.sizeBefore, job.sizeAfter!)}
            </span>
          </span>
          <Button asChild size="sm" variant="secondary" className="h-7 text-xs">
            <a href={downloadUrl(id)} download>Download</a>
          </Button>
        </>
      )}

      {status === 'error' && (
        <span className="text-xs text-destructive">{job?.error ?? 'Failed'}</span>
      )}

      {status === 'expired' && (
        <span className="text-xs text-muted-foreground">Expired</span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:3000/compress`, drop a file. Confirm job rows appear as dark cards with rounded corners, processing pulse is indigo, and done state shows size savings in green.

- [ ] **Step 3: Commit**

```bash
git add components/compress/JobRow.tsx
git commit -m "feat: dark card job rows with shadcn Badge and Button"
```

---

## Task 8: Rebuild ControlsPanel with shadcn components

**Files:**
- Replace: `components/edit/ControlsPanel.tsx`

shadcn `Switch` uses `checked`/`onCheckedChange`. shadcn `Select` uses `value`/`onValueChange`. shadcn `Slider` uses `value={[number]}`/`onValueChange={([v]) => fn(v)}`.

- [ ] **Step 1: Replace `components/edit/ControlsPanel.tsx`**

```tsx
'use client'

import { FORMATS, FORMAT_LABELS, type EditOptions } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

interface Props {
  opts: EditOptions
  onChange: (opts: EditOptions) => void
  onApply: () => void
  onReset: () => void
  applying: boolean
  hasImage: boolean
}

const FITS = ['cover', 'contain', 'fill', 'inside', 'outside'] as const
const ROTATIONS = [0, 90, 180, 270] as const
const FLIPS = ['none', 'horizontal', 'vertical'] as const

function set<K extends keyof EditOptions>(
  opts: EditOptions,
  onChange: (o: EditOptions) => void,
  key: K,
  value: EditOptions[K]
) {
  onChange({ ...opts, [key]: value || undefined })
}

export function ControlsPanel({ opts, onChange, onApply, onReset, applying, hasImage }: Props) {
  const s = (key: keyof EditOptions, value: EditOptions[typeof key]) =>
    set(opts, onChange, key, value)

  return (
    <div className="flex flex-col gap-5 w-64">

      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Output</h3>

        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Format</span>
          <Select
            value={opts.format ?? '_original'}
            onValueChange={(v) => s('format', (v === '_original' ? undefined : v) as EditOptions['format'])}
          >
            <SelectTrigger className="w-32 h-8 text-xs bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="_original" className="text-xs">Keep original</SelectItem>
              {FORMATS.filter(Boolean).map((f) => (
                <SelectItem key={f} value={f} className="text-xs">{FORMAT_LABELS[f]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Quality</span>
          <div className="flex items-center gap-2">
            <Slider
              min={1} max={100} step={1}
              value={[opts.quality ?? 80]}
              onValueChange={([v]) => s('quality', v)}
              className="w-24"
            />
            <span className="text-xs text-foreground w-6 text-right tabular-nums">{opts.quality ?? 80}</span>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dimensions</h3>

        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Width</span>
          <input
            type="number" min={1} placeholder="px"
            value={opts.width ?? ''}
            onChange={(e) => s('width', e.target.value ? Number(e.target.value) : undefined)}
            className="w-20 rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Height</span>
          <input
            type="number" min={1} placeholder="px"
            value={opts.height ?? ''}
            onChange={(e) => s('height', e.target.value ? Number(e.target.value) : undefined)}
            className="w-20 rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Fit</span>
          <Select
            value={opts.fit ?? 'cover'}
            onValueChange={(v) => s('fit', v as EditOptions['fit'])}
          >
            <SelectTrigger className="w-32 h-8 text-xs bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {FITS.map((f) => (
                <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</h3>

        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Blur</span>
          <div className="flex items-center gap-2">
            <Slider
              min={0} max={100} step={0.5}
              value={[opts.blur ?? 0]}
              onValueChange={([v]) => s('blur', v || undefined)}
              className="w-24"
            />
            <span className="text-xs text-foreground w-6 text-right tabular-nums">{opts.blur ?? 0}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Sharpen</span>
          <Switch
            checked={opts.sharpen ?? false}
            onCheckedChange={(v) => s('sharpen', v || undefined)}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Grayscale</span>
          <Switch
            checked={opts.grayscale ?? false}
            onCheckedChange={(v) => s('grayscale', v || undefined)}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Rotate</span>
          <Select
            value={String(opts.rotate ?? 0)}
            onValueChange={(v) => s('rotate', Number(v) as EditOptions['rotate'])}
          >
            <SelectTrigger className="w-32 h-8 text-xs bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {ROTATIONS.map((r) => (
                <SelectItem key={r} value={String(r)} className="text-xs">{r}°</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Flip</span>
          <Select
            value={opts.flip ?? 'none'}
            onValueChange={(v) => s('flip', (v === 'none' ? undefined : v) as EditOptions['flip'])}
          >
            <SelectTrigger className="w-32 h-8 text-xs bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {FLIPS.map((f) => (
                <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <div className="flex gap-2 pt-2">
        <Button
          onClick={onApply}
          disabled={!hasImage || applying}
          className="flex-1"
        >
          {applying ? 'Applying…' : 'Apply'}
        </Button>
        <Button
          onClick={onReset}
          disabled={!hasImage}
          variant="outline"
          className="px-4 border-border"
        >
          Reset
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:3000/edit`, drop an image. Confirm:
- Controls panel renders with dark cards, proper shadcn selects and sliders
- Sharpen and Grayscale show as toggle switches
- Apply/Reset buttons use primary and outline variants

- [ ] **Step 3: Commit**

```bash
git add components/edit/ControlsPanel.tsx
git commit -m "feat: edit controls panel with shadcn Select, Slider, Switch"
```

---

## Task 9: Restyle ImagePreview

**Files:**
- Replace: `components/edit/ImagePreview.tsx`

- [ ] **Step 1: Replace `components/edit/ImagePreview.tsx`**

```tsx
'use client'

import { downloadUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface Props {
  previewSrc: string | null
  jobId: string | null
  originalName: string | null
  ext: string | null
}

export function ImagePreview({ previewSrc, jobId, originalName, ext }: Props) {
  if (!previewSrc) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-border min-h-64 text-muted-foreground text-sm">
        Upload an image to start
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewSrc}
        alt="Preview"
        className="rounded-2xl border border-border object-contain max-h-[60vh] w-full bg-card"
      />
      {jobId && (
        <Button asChild variant="secondary" size="sm" className="self-start">
          <a
            href={downloadUrl(jobId)}
            download={originalName && ext ? `${originalName}.${ext}` : undefined}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download
          </a>
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/edit/ImagePreview.tsx
git commit -m "feat: dark image preview with rounded corners and Download button"
```

---

## Task 10: Add clipboard paste to EditPage

**Files:**
- Modify: `components/edit/EditPage.tsx`

EditPage only accepts a single file, so the paste handler takes the first valid image.

- [ ] **Step 1: Add paste listener to `components/edit/EditPage.tsx`**

Find the existing `useEffect` imports (line 3) and the `EditPage` function. Add the paste listener as a new `useEffect` after the existing blob URL cleanup effect. The full updated file:

```tsx
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { editFile, pollJob, waitForJob, downloadUrl, MAX_FILE_BYTES, type EditOptions, type JobRecord } from '@/lib/api'
import { DropZone } from '@/components/compress/DropZone'
import { ControlsPanel } from './ControlsPanel'
import { ImagePreview } from './ImagePreview'

export function EditPage() {
  const [opts, setOpts] = useState<EditOptions>({ quality: 80 })
  const [applying, setApplying] = useState(false)
  const [flashing, setFlashing] = useState(false)

  const originalFileRef = useRef<File | null>(null)
  const [firstJobId, setFirstJobId] = useState<string | null>(null)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [currentJob, setCurrentJob] = useState<JobRecord | null>(null)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)

  // Revoke blob URLs when they're replaced or on unmount
  useEffect(() => {
    return () => {
      if (previewSrc?.startsWith('blob:')) URL.revokeObjectURL(previewSrc)
    }
  }, [previewSrc])

  function loadFile(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      alert('File exceeds 50MB limit')
      return
    }
    originalFileRef.current = file
    setPreviewSrc(URL.createObjectURL(file))
    setFirstJobId(null)
    setCurrentJobId(null)
    setCurrentJob(null)
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items ?? [])
      const file = items
        .find((i) => i.kind === 'file' && i.type.startsWith('image/'))
        ?.getAsFile()
      if (!file) return
      setFlashing(true)
      setTimeout(() => setFlashing(false), 600)
      loadFile(file)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [])

  async function handleApply() {
    const originalFile = originalFileRef.current
    if (!originalFile) return

    setApplying(true)
    try {
      const source = currentJobId
        ? { sourceJobId: currentJobId }
        : { file: originalFile }

      const { id } = await editFile(opts, source)
      const job = await waitForJob(id)

      if (!job) {
        const { id: retryId } = await editFile(opts, { file: originalFile })
        const retryJob = await waitForJob(retryId)
        if (!retryJob || retryJob.status !== 'done') return
        if (!firstJobId) setFirstJobId(retryId)
        setCurrentJobId(retryId)
        setCurrentJob(retryJob)
        setPreviewSrc(downloadUrl(retryId))
        return
      }

      if (job.status !== 'done') return

      if (!firstJobId) setFirstJobId(id)
      setCurrentJobId(id)
      setCurrentJob(job)
      setPreviewSrc(downloadUrl(id))
    } finally {
      setApplying(false)
    }
  }

  const handleReset = useCallback(async () => {
    const originalFile = originalFileRef.current
    if (!originalFile) return

    if (firstJobId) {
      const job = await pollJob(firstJobId)
      if (job !== null) {
        setCurrentJobId(firstJobId)
        setCurrentJob(job)
        setPreviewSrc(downloadUrl(firstJobId))
        return
      }
    }

    setPreviewSrc(URL.createObjectURL(originalFile))
    setFirstJobId(null)
    setCurrentJobId(null)
    setCurrentJob(null)
  }, [firstJobId])

  const hasImage = !!previewSrc

  return (
    <div className="max-w-4xl w-full">
      <h1 className="text-xl font-semibold text-foreground mb-6">Edit</h1>

      {!hasImage ? (
        <div className="flex justify-center">
          <DropZone onFiles={([file]) => loadFile(file)} flashing={flashing} />
        </div>
      ) : (
        <div className="flex gap-8 items-start">
          <ImagePreview
            previewSrc={previewSrc}
            jobId={currentJobId}
            originalName={currentJob?.originalName ?? null}
            ext={currentJob?.ext ?? null}
          />
          <ControlsPanel
            opts={opts}
            onChange={setOpts}
            onApply={handleApply}
            onReset={handleReset}
            applying={applying}
            hasImage={hasImage}
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify clipboard paste on Edit page**

Open `http://localhost:3000/edit`. Copy an image to clipboard. Press `Cmd+V` / `Ctrl+V`. Confirm:
- Drop zone flashes with indigo ring
- Image loads into the preview immediately

- [ ] **Step 3: Commit**

```bash
git add components/edit/EditPage.tsx
git commit -m "feat: clipboard paste support on edit page"
```

---

## Task 11: Final visual pass and `.gitignore` update

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add `.superpowers/` to `.gitignore`**

Open `.gitignore` and append:

```
# Superpowers brainstorm session files
.superpowers/
```

- [ ] **Step 2: Full visual review**

Run `npm run dev`. Walk through both pages:

**Compress (`/compress`):**
- [ ] Sidebar expanded: logo + nav labels visible, active item highlighted
- [ ] Sidebar collapsed: only icons, tooltips on hover, no stretched backgrounds
- [ ] PanelLeft icon toggles sidebar at top (not bottom)
- [ ] Drop zone: indigo dashed border, radial glow, correct subtitle text
- [ ] Dropping files adds dark card job rows
- [ ] Pasting an image (`Cmd+V`) triggers ring flash and adds to queue

**Edit (`/edit`):**
- [ ] Drop zone centered when no image loaded
- [ ] Pasting loads the image into preview
- [ ] Controls panel: all shadcn selects, sliders, and switches functional
- [ ] Apply/Reset buttons styled correctly
- [ ] Download button appears on preview after applying edits

- [ ] **Step 3: Final commit**

```bash
git add .gitignore
git commit -m "chore: ignore .superpowers/ brainstorm session files"
```
