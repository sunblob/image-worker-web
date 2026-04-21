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
 * Number input backed by local string state so the user can freely clear,
 * backspace, and retype. Valid numbers in range are propagated to the parent
 * on every keystroke; anything invalid is reconciled on blur (empty → revert
 * to last known value, out-of-range → clamped).
 *
 * Stays in sync with external changes (e.g. a linked slider) via an effect
 * that re-mirrors `value` into the text state.
 */
export function QualityInput({ value, onChange, min = 1, max = 100, className }: Props) {
  const [text, setText] = useState(String(value));

  // Sync local text when the external value changes (slider drag, reset, etc.)
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
        if (raw === '' || raw === '-') return; // allow transient empty state
        const n = parseInt(raw, 10);
        if (Number.isFinite(n) && n >= min && n <= max) onChange(n);
      }}
      onBlur={() => {
        const n = parseInt(text, 10);
        let clamped: number;
        if (!Number.isFinite(n)) clamped = value;        // empty → revert
        else clamped = Math.min(max, Math.max(min, n));  // out-of-range → clamp
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
