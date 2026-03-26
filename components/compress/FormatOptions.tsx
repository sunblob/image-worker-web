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
          onValueChange={(v) => v !== null && onFormat(v === '_original' ? '' : v)}
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
          onValueChange={(v) => onQuality(Array.isArray(v) ? v[0] : v)}
          className="w-28"
        />
        <span className="text-sm text-foreground w-7 text-right tabular-nums">{quality}</span>
      </div>
    </div>
  )
}
