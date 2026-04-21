'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

/**
 * Number input backed by local string state so the user can freely clear
 * and retype. Valid in-range numbers propagate on every keystroke; empty
 * or out-of-range states reconcile on blur (revert or clamp).
 */
export function QualityInput({ value, onChange, min = 1, max = 100, className }: Props) {
  const [text, setText] = useState(String(value));

  // Mirror external value changes (slider drag, reset) into the text state.
  useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <Input
      type="number"
      min={min}
      max={max}
      step={1}
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw === '') return; // allow transient empty state mid-edit
        const n = parseInt(raw, 10);
        if (Number.isFinite(n) && n >= min && n <= max) onChange(n);
      }}
      onBlur={() => {
        const n = parseInt(text, 10);
        const clamped = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : value;
        if (clamped !== value) onChange(clamped);
        setText(String(clamped));
      }}
      className={cn(
        'tabular-nums text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
        className,
      )}
    />
  );
}
