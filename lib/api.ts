const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export const MAX_FILE_BYTES = 50 * 1024 * 1024
export const FORMATS = ['', 'webp', 'avif', 'jpeg', 'png'] as const
export const FORMAT_LABELS: Record<string, string> = {
  '': 'Keep original',
  webp: 'WebP',
  avif: 'AVIF',
  jpeg: 'JPEG',
  png: 'PNG',
}

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

export async function waitForJob(id: string): Promise<JobRecord | null> {
  while (true) {
    const job = await pollJob(id)
    if (job === null) return null
    if (job.status === 'done' || job.status === 'error') return job
    await new Promise((r) => setTimeout(r, 1000))
  }
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
