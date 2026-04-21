'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

/** Apply the .dark class on <html> based on theme + system preference. */
function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'system';
}

interface Props {
  /** Compact mode — shows a single icon that cycles through the three modes. */
  compact?: boolean;
  className?: string;
}

export function ThemeToggle({ compact = false, className }: Props) {
  // Start with 'system' on both server and first client render to avoid hydration mismatch.
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  // After mount, load the real stored value.
  useEffect(() => {
    setTheme(readStoredTheme());
    setMounted(true);
  }, []);

  // Re-apply whenever theme changes post-mount.
  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable (private mode) — silently ignore
    }
  }, [theme, mounted]);

  // Re-apply when system preference changes (only if on system mode)
  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') applyTheme('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, mounted]);

  const options: Array<{ value: Theme; label: string; Icon: typeof Sun }> = [
    { value: 'light', label: 'Light', Icon: Sun },
    { value: 'dark', label: 'Dark', Icon: Moon },
    { value: 'system', label: 'System', Icon: Monitor },
  ];

  if (compact) {
    // Cycle: light → dark → system → light …
    const nextMap: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' };
    const current = options.find((o) => o.value === theme) ?? options[2];
    const Icon = current.Icon;
    return (
      <button
        type="button"
        onClick={() => setTheme(nextMap[theme])}
        aria-label={`Theme: ${current.label} — click to change`}
        title={`Theme: ${current.label}`}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors',
          className,
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className={cn(
        'flex items-center gap-0.5 rounded-lg border border-border bg-secondary/50 p-0.5',
        className,
      )}
    >
      {options.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-[11px] font-medium transition-colors',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
