'use client';

import { useMemo, useState } from 'react';
import {
  compressFromUrls,
  downloadAllUrl,
  scrapeWebsite,
  type JobEntry,
  type ScrapedImage,
  type ScrapeFilters,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { FormatOptions } from '@/components/compress/FormatOptions';
import { JobRow } from '@/components/compress/JobRow';
import { Globe, Search } from 'lucide-react';

interface QueueItem extends JobEntry {
  done: boolean;
}

export function ScrapePage() {
  const [url, setUrl] = useState('');
  const [filters, setFilters] = useState<ScrapeFilters>({
    excludeIcons: true,
    excludeHead: true,
    excludeDataUri: true,
    excludeSvg: false,
  });
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ScrapedImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [format, setFormat] = useState('');
  const [quality, setQuality] = useState(93);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [compressing, setCompressing] = useState(false);

  async function handleScrape() {
    if (!url.trim()) return;
    setScraping(true);
    setError(null);
    setImages([]);
    setSelected(new Set());
    try {
      const { images } = await scrapeWebsite(url.trim(), filters);
      setImages(images);
      setSelected(new Set(images.map((i) => i.url)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scrape failed');
    } finally {
      setScraping(false);
    }
  }

  function toggle(url: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  async function handleCompressSelected() {
    const urls = Array.from(selected);
    if (!urls.length) return;
    setCompressing(true);
    try {
      const { jobs } = await compressFromUrls(urls, {
        format: format || undefined,
        quality,
      });
      setQueue((q) => [...q, ...jobs.map((j) => ({ ...j, done: false }))]);
    } finally {
      setCompressing(false);
    }
  }

  const doneJobIds = useMemo(
    () => queue.filter((j) => !j.status && j.done).map((j) => j.id),
    [queue],
  );

  function setFilter(key: keyof ScrapeFilters, value: boolean) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="w-full max-w-3xl">
        <h1 className="text-xl font-semibold text-foreground mb-6">Scrape website</h1>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
              placeholder="https://example.com"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <Button onClick={handleScrape} disabled={scraping || !url.trim()} size="sm">
            <Search className="h-4 w-4 mr-1" />
            {scraping ? 'Scraping…' : 'Scrape'}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm mb-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Filters
          </span>
          {([
            ['excludeIcons', 'Icons / favicons'],
            ['excludeHead', 'Head meta (og/twitter)'],
            ['excludeDataUri', 'Data URIs'],
            ['excludeSvg', 'SVG'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!filters[key]}
                onChange={(e) => setFilter(key, e.target.checked)}
                className="accent-primary"
              />
              <span className="text-xs text-foreground">{label}</span>
            </label>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive mt-3">
            {error}
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="w-full max-w-3xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selected.size} / {images.length} selected
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setSelected(new Set(images.map((i) => i.url)))}
              >
                Select all
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setSelected(new Set())}
              >
                Deselect all
              </Button>
            </div>
          </div>

          <FormatOptions
            format={format}
            quality={quality}
            onFormat={setFormat}
            onQuality={setQuality}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img) => {
              const isSelected = selected.has(img.url);
              return (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => toggle(img.url)}
                  className={`group relative rounded-lg border overflow-hidden text-left transition-colors ${
                    isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="aspect-square bg-secondary/30 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt ?? ''}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute top-1 left-1 h-5 w-5 rounded bg-background/90 flex items-center justify-center border border-border">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="accent-primary"
                    />
                  </div>
                  <div className="absolute top-1 right-1 text-[10px] uppercase tracking-wider bg-background/80 text-muted-foreground px-1.5 py-0.5 rounded">
                    {img.source}
                  </div>
                  <div className="p-2 text-[11px] text-muted-foreground space-y-0.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      {img.width && img.height && (
                        <span>{img.width}×{img.height}</span>
                      )}
                      {img.size != null && (
                        <span className={img.width && img.height ? 'before:content-["·"] before:mr-1' : ''}>
                          {img.size < 1024 * 1024
                            ? `${(img.size / 1024).toFixed(0)} KB`
                            : `${(img.size / (1024 * 1024)).toFixed(1)} MB`}
                        </span>
                      )}
                    </div>
                    <div className="truncate" title={img.url}>
                      {new URL(img.url).pathname.split('/').pop() || img.url}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleCompressSelected}
              disabled={compressing || selected.size === 0}
              size="sm"
            >
              {compressing ? 'Starting…' : `Compress selected (${selected.size})`}
            </Button>
          </div>
        </div>
      )}

      {queue.length > 0 && (
        <div className="w-full max-w-3xl space-y-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs text-muted-foreground">
              {queue.length} job{queue.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setQueue([])}>
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
              onDone={(id) =>
                setQueue((q) => q.map((x) => (x.id === id ? { ...x, done: true } : x)))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
