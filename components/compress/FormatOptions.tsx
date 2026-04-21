'use client';

import { FORMATS, FORMAT_LABELS, DISABLED_FORMATS } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { QualityInput } from '@/components/QualityInput';

interface Props {
  format: string;
  quality: number;
  onFormat: (f: string) => void;
  onQuality: (q: number) => void;
}

export function FormatOptions({ format, quality, onFormat, onQuality }: Props) {
  return (
    <div className="flex items-center gap-4 flex-wrap mb-6">
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Format
        </span>
        <Select
          value={format || '_original'}
          onValueChange={(v) => v !== null && onFormat(v === '_original' ? '' : v)}
        >
          <SelectTrigger className="w-52 h-8 text-sm bg-card border-border">
            <span>{FORMAT_LABELS[format] || 'Keep original'}</span>
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {FORMATS.map((f) => {
              const disabled = DISABLED_FORMATS.has(f);
              return (
                <SelectItem
                  key={f || '_original'}
                  value={f || '_original'}
                  disabled={disabled}
                  className="text-sm"
                >
                  <span className="flex items-center justify-between gap-2 w-full">
                    <span>{FORMAT_LABELS[f]}</span>
                    {disabled && (
                      <span className="rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-orange-500 text-white">
                        Coming soon
                      </span>
                    )}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Quality
        </span>
        <Slider
          min={1}
          max={100}
          step={1}
          value={[quality]}
          onValueChange={(v) => onQuality(Array.isArray(v) ? v[0] : v)}
          className="w-28"
        />
        <QualityInput value={quality} onChange={onQuality} className="w-16 text-sm" />
      </div>
    </div>
  );
}
