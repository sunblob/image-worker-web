'use client';

import { useEffect, useState } from 'react';
import { pollJob, downloadUrl, type JobRecord } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageIcon } from 'lucide-react';

interface Props {
  id: string;
  filename: string;
  /** Set to 'error' when the server immediately rejected the file (e.g. unsupported extension). Skips polling. */
  initialStatus?: 'error';
  onDone?: (id: string) => void;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function savings(before: number, after: number) {
  const pct = Math.round((1 - after / before) * 100);
  return pct > 0 ? `-${pct}%` : `+${Math.abs(pct)}%`;
}

export function JobRow({ id, filename, initialStatus, onDone }: Props) {
  const [job, setJob] = useState<JobRecord | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (initialStatus === 'error') return;

    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      const result = await pollJob(id);
      if (cancelled) return;

      if (result === null) {
        setExpired(true);
        return;
      }

      setJob((prev) => (prev?.status === result.status ? prev : result));

      if (result.status === 'done') {
        onDone?.(id);
        return;
      }

      if (result.status !== 'error') {
        timerId = setTimeout(tick, 1000);
      }
    }

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timerId);
    };
  }, [id, initialStatus, onDone]);

  if (initialStatus === 'error') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
        <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-foreground">{filename}</span>
        <Badge variant="destructive" className="text-xs">
          Unsupported format
        </Badge>
      </div>
    );
  }

  const status = expired ? 'expired' : (job?.status ?? 'processing');

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm hover:bg-secondary/30 transition-colors">
      <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate text-foreground">{filename}</span>

      {status === 'processing' && (
        <span className="text-xs text-primary animate-pulse">Processing…</span>
      )}

      {status === 'done' && job && (
        <>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatBytes(job.sizeBefore)} → {formatBytes(job.sizeAfter!)}
            <span
              className={`ml-1.5 font-medium ${job.sizeAfter! < job.sizeBefore ? 'text-green-400' : 'text-red-400'}`}
            >
              {savings(job.sizeBefore, job.sizeAfter!)}
            </span>
          </span>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs"
            render={<a href={downloadUrl(id)} download />}
          >
            Download
          </Button>
        </>
      )}

      {status === 'error' && (
        <span className="text-xs text-destructive">{job?.error ?? 'Failed'}</span>
      )}

      {status === 'expired' && <span className="text-xs text-muted-foreground">Expired</span>}
    </div>
  );
}
