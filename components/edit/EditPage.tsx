'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  editFile,
  pollJob,
  waitForJob,
  downloadUrl,
  MAX_FILE_BYTES,
  type EditOptions,
  type JobRecord,
} from '@/lib/api';
import { DropZone } from '@/components/compress/DropZone';
import { ControlsPanel } from './ControlsPanel';
import { ImagePreview } from './ImagePreview';

export function EditPage() {
  const [opts, setOpts] = useState<EditOptions>({ quality: 93 });
  const [applying, setApplying] = useState(false);
  const [flashing, setFlashing] = useState(false);

  const originalFileRef = useRef<File | null>(null);
  const [firstJobId, setFirstJobId] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [currentJob, setCurrentJob] = useState<JobRecord | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Revoke blob URLs when they're replaced or on unmount
  useEffect(() => {
    return () => {
      if (previewSrc?.startsWith('blob:')) URL.revokeObjectURL(previewSrc);
    };
  }, [previewSrc]);

  function loadFile(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      alert('File exceeds 50MB limit');
      return;
    }
    originalFileRef.current = file;
    setPreviewSrc(URL.createObjectURL(file));
    setFirstJobId(null);
    setCurrentJobId(null);
    setCurrentJob(null);
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items ?? []);
      const file = items.find((i) => i.kind === 'file' && i.type.startsWith('image/'))?.getAsFile();
      if (!file) return;
      setFlashing(true);
      setTimeout(() => setFlashing(false), 600);
      loadFile(file);
    }
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, []);

  async function handleApply() {
    const originalFile = originalFileRef.current;
    if (!originalFile) return;

    setApplying(true);
    try {
      const source = currentJobId ? { sourceJobId: currentJobId } : { file: originalFile };

      const { id } = await editFile(opts, source);
      const job = await waitForJob(id);

      if (!job) {
        // pollJob returns null on 404 — job expired before result was ready; re-upload
        const { id: retryId } = await editFile(opts, { file: originalFile });
        const retryJob = await waitForJob(retryId);
        if (!retryJob || retryJob.status !== 'done') return;
        if (!firstJobId) setFirstJobId(retryId);
        setCurrentJobId(retryId);
        setCurrentJob(retryJob);
        setPreviewSrc(downloadUrl(retryId));
        return;
      }

      if (job.status !== 'done') return;

      if (!firstJobId) setFirstJobId(id);
      setCurrentJobId(id);
      setCurrentJob(job);
      setPreviewSrc(downloadUrl(id));
    } finally {
      setApplying(false);
    }
  }

  const handleReset = useCallback(async () => {
    const originalFile = originalFileRef.current;
    if (!originalFile) return;

    if (firstJobId) {
      const job = await pollJob(firstJobId);
      if (job !== null) {
        setCurrentJobId(firstJobId);
        setCurrentJob(job);
        setPreviewSrc(downloadUrl(firstJobId));
        return;
      }
    }

    setPreviewSrc(URL.createObjectURL(originalFile));
    setFirstJobId(null);
    setCurrentJobId(null);
    setCurrentJob(null);
  }, [firstJobId]);

  const hasImage = !!previewSrc;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="w-full max-w-2xl">
        <h1 className="text-xl font-semibold text-foreground mb-6">Edit</h1>
      </div>

      {!hasImage ? (
        <DropZone onFiles={([file]) => loadFile(file)} flashing={flashing} />
      ) : (
        <div className="w-full max-w-2xl flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 min-w-0">
            <ImagePreview
              previewSrc={previewSrc}
              jobId={currentJobId}
              originalName={currentJob?.originalName ?? null}
              ext={currentJob?.ext ?? null}
            />
          </div>
          <ControlsPanel
            opts={opts}
            onChange={setOpts}
            onApply={handleApply}
            onReset={handleReset}
            applying={applying}
            hasImage={hasImage}
          />
        </div>
      )}
    </div>
  );
}
