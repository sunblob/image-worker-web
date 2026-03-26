'use client'

import { downloadUrl } from '@/lib/api'

interface Props {
  previewSrc: string | null   // object URL or API download URL
  jobId: string | null        // null before first apply
  originalName: string | null
  ext: string | null
}

export function ImagePreview({ previewSrc, jobId, originalName, ext }: Props) {
  if (!previewSrc) {
    return (
      <div className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 min-h-64 text-neutral-400 text-sm">
        Upload an image to start
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewSrc}
        alt="Preview"
        className="rounded-lg border border-neutral-200 object-contain max-h-[60vh] w-full"
      />
      {jobId && (
        <a
          href={downloadUrl(jobId)}
          download={originalName && ext ? `${originalName}.${ext}` : undefined}
          className="self-start text-xs px-3 py-1.5 rounded bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
        >
          Download
        </a>
      )}
    </div>
  )
}
