'use client'

import { FORMATS, FORMAT_LABELS, type EditOptions } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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
            onValueChange={(v) => v !== null && s('format', (v === '_original' ? undefined : v) as EditOptions['format'])}
          >
            <SelectTrigger className="w-32 h-8 text-xs bg-card border-border">
              <span>{FORMAT_LABELS[opts.format ?? ''] || 'Keep original'}</span>
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
              onValueChange={(v) => s('quality', Array.isArray(v) ? v[0] : v)}
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
            onValueChange={(v) => v !== null && s('fit', v as EditOptions['fit'])}
          >
            <SelectTrigger className="w-32 h-8 text-xs bg-card border-border">
              <span>{opts.fit ?? 'cover'}</span>
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
              onValueChange={(v) => { const n = Array.isArray(v) ? v[0] : v; s('blur', n || undefined) }}
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
            onValueChange={(v) => v !== null && s('rotate', Number(v) as EditOptions['rotate'])}
          >
            <SelectTrigger className="w-32 h-8 text-xs bg-card border-border">
              <span>{opts.rotate ?? 0}°</span>
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
            onValueChange={(v) => v !== null && s('flip', (v === 'none' ? undefined : v) as EditOptions['flip'])}
          >
            <SelectTrigger className="w-32 h-8 text-xs bg-card border-border">
              <span>{opts.flip ?? 'none'}</span>
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
