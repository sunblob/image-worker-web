'use client'

import { useEffect, useState } from 'react'
import { pollJob, downloadUrl, type JobRecord } from '@/lib/api'

interface Props {
  id: string
  filename: string
  /** Set to 'error' when the server immediately rejected the file (e.g. unsupported extension). Skips polling. */
  initialStatus?: 'error'
  onDone?: (id: string) => void
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

  function formatBytes(b: number) {
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / (1024 * 1024)).toFixed(1)} MB`
  }

  function savings(before: number, after: number) {
    const pct = Math.round((1 - after / before) * 100)
    return pct > 0 ? `-${pct}%` : `+${Math.abs(pct)}%`
  }

  if (initialStatus === 'error') {
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
