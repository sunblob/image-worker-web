'use client'

import { FORMATS, FORMAT_LABELS } from '@/lib/api'

interface Props {
  format: string
  quality: number
  onFormat: (f: string) => void
  onQuality: (q: number) => void
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
