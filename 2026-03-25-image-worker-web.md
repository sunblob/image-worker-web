# image-worker-web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Next.js 15 frontend for image-worker — sidebar layout with Compress (batch) and Edit (single image, cumulative) pages.

**Architecture:** Next.js 15 App Router. Server components for layout/pages (thin shells), client components for all interactive UI. A typed API client in `lib/api.ts` wraps all fetch calls. Each `JobRow` owns its own polling loop. Edit page tracks `currentJobId` in state for cumulative chaining, and keeps the original `File` object in memory for seamless re-upload on reset.

**Tech Stack:** Next.js 15, React, TypeScript, Tailwind CSS. `NEXT_PUBLIC_API_URL` env var points to the API.

**Spec:** `docs/superpowers/specs/2026-03-25-image-worker-design.md`

---

## File Map

```
image-worker-web/
├── .env.local                          # NEXT_PUBLIC_API_URL=http://localhost:3001
├── app/
│   ├── layout.tsx                      # Root layout — renders Sidebar + {children}
│   ├── page.tsx                        # Redirects to /compress
│   ├── compress/
│   │   └── page.tsx                    # Thin server shell, renders <CompressPage />
│   └── edit/
│       └── page.tsx                    # Thin server shell, renders <EditPage />
├── components/
│   ├── Sidebar.tsx                     # Left nav with Compress / Edit links
│   ├── compress/
│   │   ├── CompressPage.tsx            # 'use client' — state, handlers, layout
│   │   ├── DropZone.tsx                # Drag-and-drop / click file input
│   │   ├── FormatOptions.tsx           # Format dropdown + quality slider
│   │   └── JobRow.tsx                  # One row per job; owns polling loop
│   └── edit/
│       ├── EditPage.tsx                # 'use client' — edit session state
│       ├── ImagePreview.tsx            # Shows current preview + download button
│       └── ControlsPanel.tsx           # All edit controls + Apply / Reset buttons
└── lib/
    └── api.ts                          # Typed fetch wrappers for all endpoints
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `image-worker-web/` (entire project)
- Create: `.env.local`

- [ ] **Step 1: Scaffold Next.js 15 app**

```bash
cd /Users/glebokhrimenko/projects
npx create-next-app@latest image-worker-web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
cd image-worker-web
```

- [ ] **Step 2: Create `.env.local`**

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

- [ ] **Step 3: Remove boilerplate**

Delete contents of `app/page.tsx`, `app/globals.css` (keep Tailwind directives only). Delete `public/` SVGs.

Replace `app/globals.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Verify dev server starts**

```bash
bun run dev
```

Expected: server on `http://localhost:3000`, no errors.

---

## Task 2: API Client

**Files:**
- Create: `lib/api.ts`

This is the single place that knows about `NEXT_PUBLIC_API_URL`. All components import from here — never `fetch` directly.

- [ ] **Step 1: Write `lib/api.ts`**

```ts
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface JobEntry {
  id: string
  filename: string
  status?: 'error'
}

export interface CompressResponse {
  jobs: JobEntry[]
}

export type JobStatus = 'processing' | 'done' | 'error'

export interface JobRecord {
  id: string
  status: JobStatus
  originalName: string
  sizeBefore: number
  sizeAfter?: number
  ext?: string
  error?: string
  createdAt: number
}

export interface EditOptions {
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
  quality?: number
  width?: number
  height?: number
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  blur?: number
  sharpen?: boolean
  grayscale?: boolean
  rotate?: 0 | 90 | 180 | 270
  flip?: 'horizontal' | 'vertical'
}

export interface EditResponse {
  id: string
  filename: string
}

export async function compressFiles(
  files: File[],
  opts: { format?: string; quality?: number }
): Promise<CompressResponse> {
  const form = new FormData()
  for (const file of files) form.append('files', file)
  if (opts.format) form.append('format', opts.format)
  if (opts.quality != null) form.append('quality', String(opts.quality))
  const res = await fetch(`${BASE}/compress`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`compress failed: ${res.status}`)
  return res.json()
}

export async function pollJob(id: string): Promise<JobRecord | null> {
  const res = await fetch(`${BASE}/jobs/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`poll failed: ${res.status}`)
  return res.json()
}

export async function editFile(
  opts: EditOptions,
  source: { file: File } | { sourceJobId: string }
): Promise<EditResponse> {
  const form = new FormData()
  if ('file' in source) {
    form.append('file', source.file)
  } else {
    form.append('sourceJobId', source.sourceJobId)
  }
  form.append('options', JSON.stringify(opts))
  const res = await fetch(`${BASE}/edit`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`edit failed: ${res.status}`)
  return res.json()
}

export function downloadUrl(id: string): string {
  return `${BASE}/jobs/${id}/download`
}

export function downloadAllUrl(ids: string[]): string {
  return `${BASE}/jobs/download?ids=${ids.join(',')}`
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
bun run build 2>&1 | head -20
```

Expected: no type errors in `lib/api.ts`.

---

## Task 3: Layout + Sidebar

**Files:**
- Create: `components/Sidebar.tsx`
- Modify: `app/layout.tsx`
- Create: `app/page.tsx`

- [ ] **Step 1: Write `components/Sidebar.tsx`**

```tsx
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
```

- [ ] **Step 2: Write `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'

export const metadata: Metadata = { title: 'Image Worker' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen bg-white text-neutral-900 antialiased">
        <Sidebar />
        <main className="flex-1 p-8">{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Write `app/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
export default function Home() {
  redirect('/compress')
}
```

- [ ] **Step 4: Create page shells**

`app/compress/page.tsx`:
```tsx
export default function CompressPage() {
  return <div className="text-neutral-400">Compress coming soon</div>
}
```

`app/edit/page.tsx`:
```tsx
export default function EditPageShell() {
  return <div className="text-neutral-400">Edit coming soon</div>
}
```

- [ ] **Step 5: Verify in browser**

```bash
bun run dev
```

Open `http://localhost:3000` → redirects to `/compress`. Sidebar shows both links. Active link is highlighted.

---

## Task 4: Compress — DropZone + FormatOptions

**Files:**
- Create: `components/compress/DropZone.tsx`
- Create: `components/compress/FormatOptions.tsx`

- [ ] **Step 1: Write `components/compress/DropZone.tsx`**

Accepts multiple files, enforces 50MB limit client-side, calls `onFiles` with the valid list.

```tsx
'use client'

import { useRef, useState } from 'react'

const MAX_BYTES = 50 * 1024 * 1024

interface Props {
  onFiles: (files: File[]) => void
  disabled?: boolean
}

export function DropZone({ onFiles, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handle(files: FileList | null) {
    if (!files) return
    const valid = Array.from(files).filter((f) => {
      if (f.size > MAX_BYTES) {
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
      className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors select-none ${
        dragging ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-300 hover:border-neutral-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <p className="text-sm text-neutral-500">
        Drop images here or <span className="underline">click to browse</span>
      </p>
      <p className="text-xs text-neutral-400 mt-1">Max 50MB per file</p>
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

- [ ] **Step 2: Write `components/compress/FormatOptions.tsx`**

```tsx
'use client'

interface Props {
  format: string
  quality: number
  onFormat: (f: string) => void
  onQuality: (q: number) => void
}

const FORMATS = ['', 'webp', 'avif', 'jpeg', 'png'] as const
const FORMAT_LABELS: Record<string, string> = {
  '': 'Keep original',
  webp: 'WebP',
  avif: 'AVIF',
  jpeg: 'JPEG',
  png: 'PNG',
}

export function FormatOptions({ format, quality, onFormat, onQuality }: Props) {
  return (
    <div className="flex items-center gap-6">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-neutral-500">Format</span>
        <select
          value={format}
          onChange={(e) => onFormat(e.target.value)}
          className="border border-neutral-200 rounded px-2 py-1 text-sm"
        >
          {FORMATS.map((f) => (
            <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-neutral-500">Quality</span>
        <input
          type="range"
          min={1}
          max={100}
          value={quality}
          onChange={(e) => onQuality(Number(e.target.value))}
          className="w-28"
        />
        <span className="w-8 text-neutral-700">{quality}</span>
      </label>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
bun run build 2>&1 | grep -E "error|Error" | head -10
```

Expected: no errors.

---

## Task 5: Compress — JobRow with Polling

**Files:**
- Create: `components/compress/JobRow.tsx`

Each `JobRow` receives its job ID on mount and polls `GET /jobs/:id` every second until terminal state. It is self-contained — no parent manages polling.

- [ ] **Step 1: Write `components/compress/JobRow.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { pollJob, downloadUrl, type JobRecord } from '@/lib/api'

interface Props {
  id: string
  filename: string
  initialStatus?: 'error'
  onDone?: (id: string) => void
}

export function JobRow({ id, filename, initialStatus, onDone }: Props) {
  const [job, setJob] = useState<JobRecord | null>(null)
  const [expired, setExpired] = useState(false)

  // If immediately errored (unsupported ext), skip polling
  const immediateError = initialStatus === 'error'

  useEffect(() => {
    if (immediateError) return

    let cancelled = false

    async function tick() {
      const result = await pollJob(id)
      if (cancelled) return

      if (result === null) {
        setExpired(true)
        return
      }

      setJob(result)

      if (result.status === 'done') {
        onDone?.(id)
        return
      }

      if (result.status !== 'error') {
        setTimeout(tick, 1000)
      }
    }

    tick()
    return () => { cancelled = true }
  }, [id, immediateError, onDone])

  function formatBytes(b: number) {
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / (1024 * 1024)).toFixed(1)} MB`
  }

  function savings(before: number, after: number) {
    const pct = Math.round((1 - after / before) * 100)
    return pct > 0 ? `-${pct}%` : `+${Math.abs(pct)}%`
  }

  if (immediateError) {
    return (
      <div className="flex items-center gap-4 py-2 px-3 rounded bg-red-50 text-sm">
        <span className="flex-1 truncate text-neutral-700">{filename}</span>
        <span className="text-red-500 text-xs">Unsupported format</span>
      </div>
    )
  }

  const status = expired ? 'expired' : (job?.status ?? 'processing')

  return (
    <div className="flex items-center gap-4 py-2 px-3 rounded hover:bg-neutral-50 text-sm">
      <span className="flex-1 truncate text-neutral-700">{filename}</span>

      {status === 'processing' && (
        <span className="text-xs text-neutral-400 animate-pulse">Processing…</span>
      )}

      {status === 'done' && job && (
        <>
          <span className="text-xs text-neutral-400">
            {formatBytes(job.sizeBefore)} → {formatBytes(job.sizeAfter!)}
            <span className="ml-1 text-green-600">{savings(job.sizeBefore, job.sizeAfter!)}</span>
          </span>
          <a
            href={downloadUrl(id)}
            download
            className="text-xs px-2 py-1 rounded bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
          >
            Download
          </a>
        </>
      )}

      {status === 'error' && (
        <span className="text-red-500 text-xs">{job?.error ?? 'Failed'}</span>
      )}

      {status === 'expired' && (
        <span className="text-neutral-400 text-xs">Expired</span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
bun run build 2>&1 | grep -E "error|Error" | head -10
```

---

## Task 6: Compress — Page Assembly

**Files:**
- Create: `components/compress/CompressPage.tsx`
- Modify: `app/compress/page.tsx`

- [ ] **Step 1: Write `components/compress/CompressPage.tsx`**

```tsx
'use client'

import { useState, useCallback } from 'react'
import { compressFiles, downloadAllUrl, type JobEntry } from '@/lib/api'
import { DropZone } from './DropZone'
import { FormatOptions } from './FormatOptions'
import { JobRow } from './JobRow'

interface QueueItem extends JobEntry {
  key: string // stable key = id
}

export function CompressPage() {
  const [format, setFormat] = useState('')
  const [quality, setQuality] = useState(80)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: File[]) {
    setUploading(true)
    try {
      const { jobs } = await compressFiles(files, {
        format: format || undefined,
        quality,
      })
      setQueue((q) => [
        ...q,
        ...jobs.map((j) => ({ ...j, key: j.id })),
      ])
    } finally {
      setUploading(false)
    }
  }

  const handleDone = useCallback((id: string) => {
    setDoneIds((s) => new Set(s).add(id))
  }, [])

  const doneJobIds = queue
    .filter((j) => !j.status && doneIds.has(j.id))
    .map((j) => j.id)

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Compress</h1>

      <FormatOptions
        format={format}
        quality={quality}
        onFormat={setFormat}
        onQuality={setQuality}
      />

      <DropZone onFiles={handleFiles} disabled={uploading} />

      {queue.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400">{queue.length} file{queue.length !== 1 ? 's' : ''}</span>
            {doneJobIds.length > 0 && (
              <a
                href={downloadAllUrl(doneJobIds)}
                download
                className="text-xs px-3 py-1.5 rounded bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
              >
                Download all ({doneJobIds.length})
              </a>
            )}
          </div>
          {queue.map((item) => (
            <JobRow
              key={item.key}
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

- [ ] **Step 2: Update `app/compress/page.tsx`**

```tsx
import { CompressPage } from '@/components/compress/CompressPage'

export default function Page() {
  return <CompressPage />
}
```

- [ ] **Step 3: Verify in browser**

```bash
bun run dev
```

- Go to `/compress`
- Drop an image → row appears with "Processing…"
- Row updates to show size before → after with savings %
- Download button appears when done
- "Download all" button appears once ≥1 job is done

---

## Task 7: Edit — ControlsPanel

**Files:**
- Create: `components/edit/ControlsPanel.tsx`

- [ ] **Step 1: Write `components/edit/ControlsPanel.tsx`**

```tsx
'use client'

import type { EditOptions } from '@/lib/api'

interface Props {
  opts: EditOptions
  onChange: (opts: EditOptions) => void
  onApply: () => void
  onReset: () => void
  applying: boolean
  hasImage: boolean
}

const FORMATS = ['', 'webp', 'avif', 'jpeg', 'png'] as const
const FITS = ['', 'cover', 'contain', 'fill', 'inside', 'outside'] as const
const ROTATIONS = [0, 90, 180, 270] as const
const FLIPS = ['', 'horizontal', 'vertical'] as const

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
    <div className="space-y-5 w-64">
      {/* Output */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Output</h3>
        <label className="flex items-center justify-between text-sm">
          <span>Format</span>
          <select
            value={opts.format ?? ''}
            onChange={(e) => s('format', e.target.value as EditOptions['format'])}
            className="border border-neutral-200 rounded px-2 py-1 text-sm"
          >
            {FORMATS.map((f) => <option key={f} value={f}>{f || 'Keep original'}</option>)}
          </select>
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>Quality</span>
          <div className="flex items-center gap-2">
            <input
              type="range" min={1} max={100}
              value={opts.quality ?? 80}
              onChange={(e) => s('quality', Number(e.target.value))}
              className="w-24"
            />
            <span className="w-7 text-right">{opts.quality ?? 80}</span>
          </div>
        </label>
      </section>

      {/* Dimensions */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Dimensions</h3>
        <label className="flex items-center justify-between text-sm">
          <span>Width</span>
          <input
            type="number" min={1} placeholder="px"
            value={opts.width ?? ''}
            onChange={(e) => s('width', e.target.value ? Number(e.target.value) : undefined)}
            className="w-20 border border-neutral-200 rounded px-2 py-1 text-sm"
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>Height</span>
          <input
            type="number" min={1} placeholder="px"
            value={opts.height ?? ''}
            onChange={(e) => s('height', e.target.value ? Number(e.target.value) : undefined)}
            className="w-20 border border-neutral-200 rounded px-2 py-1 text-sm"
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>Fit</span>
          <select
            value={opts.fit ?? ''}
            onChange={(e) => s('fit', e.target.value as EditOptions['fit'])}
            className="border border-neutral-200 rounded px-2 py-1 text-sm"
          >
            {FITS.map((f) => <option key={f} value={f}>{f || 'cover'}</option>)}
          </select>
        </label>
      </section>

      {/* Filters */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Filters</h3>
        <label className="flex items-center justify-between text-sm">
          <span>Blur</span>
          <div className="flex items-center gap-2">
            <input
              type="range" min={0} max={100} step={0.5}
              value={opts.blur ?? 0}
              onChange={(e) => s('blur', Number(e.target.value) || undefined)}
              className="w-24"
            />
            <span className="w-7 text-right">{opts.blur ?? 0}</span>
          </div>
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>Sharpen</span>
          <input
            type="checkbox"
            checked={opts.sharpen ?? false}
            onChange={(e) => s('sharpen', e.target.checked || undefined)}
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>Grayscale</span>
          <input
            type="checkbox"
            checked={opts.grayscale ?? false}
            onChange={(e) => s('grayscale', e.target.checked || undefined)}
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>Rotate</span>
          <select
            value={opts.rotate ?? 0}
            onChange={(e) => s('rotate', Number(e.target.value) as EditOptions['rotate'])}
            className="border border-neutral-200 rounded px-2 py-1 text-sm"
          >
            {ROTATIONS.map((r) => <option key={r} value={r}>{r}°</option>)}
          </select>
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>Flip</span>
          <select
            value={opts.flip ?? ''}
            onChange={(e) => s('flip', e.target.value as EditOptions['flip'])}
            className="border border-neutral-200 rounded px-2 py-1 text-sm"
          >
            {FLIPS.map((f) => <option key={f} value={f}>{f || 'none'}</option>)}
          </select>
        </label>
      </section>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onApply}
          disabled={!hasImage || applying}
          className="flex-1 py-2 rounded bg-neutral-900 text-white text-sm font-medium
            hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {applying ? 'Applying…' : 'Apply'}
        </button>
        <button
          onClick={onReset}
          disabled={!hasImage}
          className="px-4 py-2 rounded border border-neutral-200 text-sm text-neutral-600
            hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
bun run build 2>&1 | grep -E "error|Error" | head -10
```

---

## Task 8: Edit — ImagePreview

**Files:**
- Create: `components/edit/ImagePreview.tsx`

- [ ] **Step 1: Write `components/edit/ImagePreview.tsx`**

```tsx
'use client'

import { downloadUrl } from '@/lib/api'

interface Props {
  previewSrc: string | null   // object URL or API download URL
  jobId: string | null        // null before first apply
  originalName: string | null
  ext: string | null
}

export function ImagePreview({ previewSrc, jobId, originalName, ext }: Props) {
  if (!previewSrc) {
    return (
      <div className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 min-h-64 text-neutral-400 text-sm">
        Upload an image to start
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewSrc}
        alt="Preview"
        className="rounded-lg border border-neutral-200 object-contain max-h-[60vh] w-full"
      />
      {jobId && (
        <a
          href={downloadUrl(jobId)}
          download={originalName && ext ? `${originalName}.${ext}` : undefined}
          className="self-start text-xs px-3 py-1.5 rounded bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
        >
          Download
        </a>
      )}
    </div>
  )
}
```

---

## Task 9: Edit — Page Assembly

**Files:**
- Create: `components/edit/EditPage.tsx`
- Modify: `app/edit/page.tsx`

The edit session tracks:
- `originalFile` — kept in memory for seamless re-upload on reset
- `firstJobId` — the job ID from the first apply (used for reset logic)
- `currentJobId` — chained for subsequent applies
- `previewSrc` — object URL before first apply, then API download URL

**Cumulative chaining:** Apply sends `sourceJobId = currentJobId` (except first apply which sends the file). After each apply, `currentJobId` updates to the new job ID.

**Reset logic:** Check if `firstJobId` is still alive (poll returns non-null). If alive, set `currentJobId = firstJobId` and update preview. If expired (404), re-upload `originalFile`.

- [ ] **Step 1: Write `components/edit/EditPage.tsx`**

```tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { editFile, pollJob, downloadUrl, type EditOptions, type JobRecord } from '@/lib/api'
import { ControlsPanel } from './ControlsPanel'
import { ImagePreview } from './ImagePreview'

const MAX_BYTES = 50 * 1024 * 1024

export function EditPage() {
  const [opts, setOpts] = useState<EditOptions>({ quality: 80 })
  const [applying, setApplying] = useState(false)

  // Session state
  const originalFileRef = useRef<File | null>(null)
  const [firstJobId, setFirstJobId] = useState<string | null>(null)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [currentJob, setCurrentJob] = useState<JobRecord | null>(null)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }

  function loadFile(file: File) {
    if (file.size > MAX_BYTES) {
      alert('File exceeds 50MB limit')
      return
    }
    // Reset session on new file
    if (previewSrc?.startsWith('blob:')) URL.revokeObjectURL(previewSrc)
    originalFileRef.current = file
    setPreviewSrc(URL.createObjectURL(file))
    setFirstJobId(null)
    setCurrentJobId(null)
    setCurrentJob(null)
  }

  async function waitForJob(id: string): Promise<JobRecord | null> {
    while (true) {
      const job = await pollJob(id)
      if (job === null) return null
      if (job.status === 'done' || job.status === 'error') return job
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

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
        // sourceJobId expired mid-apply; re-upload and retry
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
        // First job still alive — reuse it
        setCurrentJobId(firstJobId)
        setCurrentJob(job)
        setPreviewSrc(downloadUrl(firstJobId))
        return
      }
    }

    // First job expired — re-upload original
    if (previewSrc?.startsWith('blob:')) URL.revokeObjectURL(previewSrc)
    setPreviewSrc(URL.createObjectURL(originalFile))
    setFirstJobId(null)
    setCurrentJobId(null)
    setCurrentJob(null)
  }, [firstJobId, previewSrc])

  const hasImage = !!originalFileRef.current
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold mb-6">Edit</h1>

      {!hasImage ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-neutral-300 rounded-lg p-16 text-center cursor-pointer hover:border-neutral-400 transition-colors"
        >
          <p className="text-sm text-neutral-500">Drop an image here or <span className="underline">click to browse</span></p>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
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

- [ ] **Step 2: Update `app/edit/page.tsx`**

```tsx
import { EditPage } from '@/components/edit/EditPage'

export default function Page() {
  return <EditPage />
}
```

- [ ] **Step 3: Verify full build**

```bash
bun run build
```

Expected: build succeeds, no TypeScript errors.

- [ ] **Step 4: Smoke test in browser**

```bash
bun run dev
```

**Compress:**
1. Go to `/compress`
2. Drop 2–3 images → rows appear immediately
3. Rows poll and update to show size savings
4. Per-file download works
5. "Download all" button appears and downloads a zip

**Edit:**
1. Go to `/edit`
2. Drop an image → preview shows
3. Set width=400, Apply → preview updates to 400px wide image
4. Set blur=5, Apply → blurred 400px image (cumulative)
5. Click Reset → preview reverts to first-apply result (or re-uploads if expired)
6. Download button downloads the current result

---

## Verification Checklist

- [ ] `/compress`: multiple files upload concurrently, each row polls independently
- [ ] `/compress`: unsupported file extension shows error row immediately (no polling)
- [ ] `/compress`: "Download all" only includes `done` jobs
- [ ] `/edit`: Apply is disabled while in-flight
- [ ] `/edit`: Reset with live first job reuses it (no re-upload)
- [ ] `/edit`: Reset with expired first job re-uploads from memory seamlessly
- [ ] Build passes: `bun run build` with no errors
