'use client';

import { useState, useCallback, useEffect } from 'react';
import { compressFiles, compressFromUrls, downloadAllUrl, type JobEntry } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { DropZone } from './DropZone';
import { FormatOptions } from './FormatOptions';
import { JobRow } from './JobRow';

interface QueueItem extends JobEntry {
  done: boolean;
}

export function CompressPage() {
  const [format, setFormat] = useState('');
  const [quality, setQuality] = useState(93);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [flashing, setFlashing] = useState(false);

  async function handleFiles(files: File[]) {
    setUploading(true);
    try {
      const { jobs } = await compressFiles(files, {
        format: format || undefined,
        quality,
      });
      setQueue((q) => [...q, ...jobs.map((j) => ({ ...j, done: false }))]);
    } finally {
      setUploading(false);
    }
  }

  async function handleUrls(urls: string[]) {
    setUploading(true);
    try {
      const { jobs } = await compressFromUrls(urls, {
        format: format || undefined,
        quality,
      });
      setQueue((q) => [...q, ...jobs.map((j) => ({ ...j, done: false }))]);
    } finally {
      setUploading(false);
    }
  }

  const handleDone = useCallback((id: string) => {
    setQueue((q) => q.map((item) => (item.id === id ? { ...item, done: true } : item)));
  }, []);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items ?? []);
      const files = items
        .filter((i) => i.kind === 'file' && i.type.startsWith('image/'))
        .map((i) => i.getAsFile())
        .filter(Boolean) as File[];
      if (!files.length) return;
      setFlashing(true);
      setTimeout(() => setFlashing(false), 600);
      handleFiles(files);
    }
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, quality]);

  const doneJobIds = queue.filter((j) => !j.status && j.done).map((j) => j.id);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="w-full max-w-2xl">
        <h1 className="text-xl font-semibold text-foreground mb-6">Compress</h1>

        <FormatOptions
          format={format}
          quality={quality}
          onFormat={setFormat}
          onQuality={setQuality}
        />
      </div>

      <DropZone onFiles={handleFiles} onUrls={handleUrls} disabled={uploading} flashing={flashing} />

      {queue.length > 0 && (
        <div className="w-full max-w-2xl space-y-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs text-muted-foreground">
              {queue.length} file{queue.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setQueue([])}
              >
                Clear
              </Button>
              {doneJobIds.length > 0 && (
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  render={<a href={downloadAllUrl(doneJobIds)} download />}
                >
                  Download all ({doneJobIds.length})
                </Button>
              )}
            </div>
          </div>
          {queue.map((item) => (
            <JobRow
              key={item.id}
              id={item.id}
              filename={item.filename}
              initialStatus={item.status}
              onDone={handleDone}
            />
          ))}
        </div>
      )}
    </div>
  );
}
