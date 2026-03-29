'use client';

import { downloadUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface Props {
  previewSrc: string | null;
  jobId: string | null;
  originalName: string | null;
  ext: string | null;
}

export function ImagePreview({ previewSrc, jobId, originalName, ext }: Props) {
  if (!previewSrc) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-border min-h-64 text-muted-foreground text-sm">
        Upload an image to start
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewSrc}
        alt="Preview"
        className="rounded-2xl border border-border object-contain max-h-[60vh] w-full bg-card"
      />
      {jobId && (
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          render={
            <a
              href={downloadUrl(jobId)}
              download={originalName && ext ? `${originalName}.${ext}` : undefined}
            />
          }
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Download
        </Button>
      )}
    </div>
  );
}
