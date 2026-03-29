'use client';

import { useRef, useState } from 'react';
import { MAX_FILE_BYTES } from '@/lib/api';
import { Upload } from 'lucide-react';

interface Props {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  flashing?: boolean;
}

export function DropZone({ onFiles, disabled, flashing }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handle(files: FileList | null) {
    if (!files) return;
    const valid = Array.from(files).filter((f) => {
      if (f.size > MAX_FILE_BYTES) {
        alert(`${f.name} exceeds 50MB limit`);
        return false;
      }
      return true;
    });
    if (valid.length) onFiles(valid);
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) handle(e.dataTransfer.files);
      }}
      className={[
        'relative flex h-56 w-full max-w-2xl flex-col items-center justify-center gap-3',
        'rounded-2xl border-2 border-dashed transition-all duration-200 select-none',
        'cursor-pointer',
        dragging ? 'border-primary/60 scale-[1.01]' : 'border-primary/40 hover:border-primary/60',
        disabled ? 'opacity-50 pointer-events-none' : '',
        flashing ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : '',
      ].join(' ')}
      style={{
        background: dragging
          ? 'radial-gradient(ellipse at 50% 60%, rgba(232,114,58,0.12) 0%, transparent 70%)'
          : 'radial-gradient(ellipse at 50% 60%, rgba(232,114,58,0.06) 0%, transparent 70%)',
      }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Upload className="h-6 w-6 text-primary" />
      </div>
      <p className="text-base font-semibold text-foreground">Drop images here</p>
      <p className="text-sm text-muted-foreground text-center leading-relaxed">
        or <span className="text-primary">click to browse</span>
        {' · '}
        <span className="text-primary">paste from clipboard</span>
        <br />
        PNG, JPG, WEBP, AVIF · Max 50MB per file
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
    </div>
  );
}
