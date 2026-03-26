'use client'

import { FORMATS, FORMAT_LABELS, type EditOptions } from '@/lib/api'

interface Props {
  opts: EditOptions
  onChange: (opts: EditOptions) => void
  onApply: () => void
  onReset: () => void
  applying: boolean
  hasImage: boolean
}

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
      <section className="space-y-2">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Output</h3>
        <label className="flex items-center justify-between text-sm">
          <span>Format</span>
          <select
            value={opts.format ?? ''}
            onChange={(e) => s('format', e.target.value as EditOptions['format'])}
            className="border border-neutral-200 rounded px-2 py-1 text-sm"
          >
            {FORMATS.map((f) => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
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
