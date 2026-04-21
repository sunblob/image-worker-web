'use client';

import { FORMATS, FORMAT_LABELS, DISABLED_FORMATS } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Props {
  /** Empty string means "keep original". */
  value: string;
  onChange: (value: string) => void;
  size?: 'xs' | 'sm';
  triggerClassName?: string;
}

// Base UI's Select forbids empty-string values, so we swap '' with a sentinel
// internally and translate on the boundary.
const KEEP_ORIGINAL = '_original';

export function FormatSelect({ value, onChange, size = 'sm', triggerClassName }: Props) {
  const textClass = size === 'xs' ? 'text-xs' : 'text-sm';

  return (
    <Select
      value={value || KEEP_ORIGINAL}
      onValueChange={(v) => v !== null && onChange(v === KEEP_ORIGINAL ? '' : v)}
    >
      <SelectTrigger className={cn('h-8 bg-card border-border', textClass, triggerClassName)}>
        <span>{FORMAT_LABELS[value] || 'Keep original'}</span>
      </SelectTrigger>
      <SelectContent className="bg-card border-border">
        <SelectItem value={KEEP_ORIGINAL} className={textClass}>
          Keep original
        </SelectItem>
        {FORMATS.filter(Boolean).map((f) => {
          const disabled = DISABLED_FORMATS.has(f);
          return (
            <SelectItem key={f} value={f} disabled={disabled} className={textClass}>
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
  );
}
