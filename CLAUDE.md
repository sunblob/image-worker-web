@AGENTS.md

# UI components

**Always prefer an existing shadcn component over a raw HTML element or ad-hoc styled div.** This project uses shadcn (`components.json` present; components live in `components/ui/`). Before writing a styled `<input>`, `<button>`, `<select>`, dialog, dropdown, etc., check `components/ui/` for a matching component.

If the component you need isn't already there, **install it via the CLI** rather than hand-writing one:

```bash
bunx shadcn@latest add <component>     # e.g. input, dialog, tabs, card
```

Then import from `@/components/ui/<component>`. This keeps border colors, focus rings, disabled states, and dark-mode variants consistent with the rest of the app — they all come from the same source.

Only drop down to a raw element when no shadcn primitive fits (e.g. a very custom control), and mention why in a comment.

# Tailwind spacing & sizing

**Use Tailwind's scale classes, not arbitrary pixel values.** Prefer `w-4`, `h-8`, `gap-2`, `p-3`, `mt-6` over `w-[16px]`, `h-[32px]`, `gap-[8px]`, `p-[12px]`, `mt-[24px]`. The scale keeps spacing consistent across the app and respects the theme's rhythm.

- `w-1` = 4px, `w-2` = 8px, `w-3` = 12px, `w-4` = 16px, `w-5` = 20px, `w-6` = 24px, `w-8` = 32px, `w-10` = 40px, `w-12` = 48px, `w-16` = 64px, `w-20` = 80px, `w-24` = 96px (and so on — multiply by 4)
- Same scale applies to `h-*`, `p-*`, `m-*`, `gap-*`, `space-*`, etc.

Arbitrary values (`w-[16px]`, `text-[13px]`) are acceptable **only** when the scale genuinely doesn't fit — e.g. matching an exact external dimension or a precise design-token value that falls between steps. If you use one, keep it rare and prefer the closest scale value otherwise.
