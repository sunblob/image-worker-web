'use client';

import { useRef, useState } from 'react';
import { MAX_FILE_BYTES } from '@/lib/api';
import { Upload, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onFiles: (files: File[]) => void;
  onUrls?: (urls: string[]) => void;
  disabled?: boolean;
  flashing?: boolean;
}

export function DropZone({ onFiles, onUrls, disabled, flashing }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [urlText, setUrlText] = useState('');

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

  function submitUrls() {
    const urls = urlText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!urls.length) return;
    onUrls?.(urls);
    setUrlText('');
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="inline-flex rounded-lg border border-border bg-card p-0.5 mb-3">
        <button
          type="button"
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            mode === 'file' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setMode('file')}
        >
          Upload
        </button>
        <button
          type="button"
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            mode === 'url' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setMode('url')}
        >
          From URL
        </button>
      </div>

      {mode === 'file' ? (
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
            'relative flex h-56 w-full flex-col items-center justify-center gap-3',
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
            PNG, JPG, WEBP, AVIF, TIFF, HEIF, JXL · Max 50MB per file
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
      ) : (
        <div
          className={[
            'flex h-56 w-full flex-col gap-3 rounded-2xl border-2 border-dashed p-4',
            'border-primary/40',
            disabled ? 'opacity-50 pointer-events-none' : '',
          ].join(' ')}
          style={{
            background: 'radial-gradient(ellipse at 50% 60%, rgba(232,114,58,0.06) 0%, transparent 70%)',
          }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <LinkIcon className="h-4 w-4 text-primary" />
            Paste image URLs — one per line
          </div>
          <textarea
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            placeholder={'https://example.com/photo.jpg\nhttps://example.com/banner.png'}
            className="flex-1 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">PNG, JPG, WEBP, AVIF, TIFF, HEIF, JXL</span>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={submitUrls}
              disabled={disabled || !urlText.trim()}
            >
              Fetch &amp; compress
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
