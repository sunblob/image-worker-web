'use client';

import { Slider } from '@/components/ui/slider';
import { QualityInput } from '@/components/QualityInput';
import { FormatSelect } from '@/components/FormatSelect';

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
        <FormatSelect value={format} onChange={onFormat} size="sm" triggerClassName="w-52" />
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
