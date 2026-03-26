'use client'

import { useState, useCallback } from 'react'
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

  const doneJobIds = queue.filter((j) => !j.status && j.done).map((j) => j.id)

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
