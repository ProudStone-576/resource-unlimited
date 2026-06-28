# @ru/ui

Shared React + Tailwind component library.

## Exports

- `Button`, `Input`, `Textarea`, `Card`, `CardBody`, `CardTitle`
- `Container`, `Section`, `Badge`
- `cn(...)` className helper (clsx + tailwind-merge)
- `tailwind-preset` (Tailwind 3 preset shared by the web app)

## Tailwind preset

`tailwind-preset.cjs` exposes:

- `brand` blue scale (default action color)
- `accent` orange (CTAs)
- `steel` neutral grayscale
- font tokens (`--font-sans`, `--font-display`)
- `max-w-container` (1240px)

Consume from a Tailwind config:

```js
const preset = require('@ru/ui/tailwind-preset');
module.exports = {
  presets: [preset],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};
```

## Adding components

1. Drop the component into `src/ComponentName.tsx`
2. Re-export from `src/index.ts`
3. Keep components presentational — no data fetching, no Next.js imports

## TODO (later phases)

- Form primitives (Select, Combobox, FileUploader)
- DataTable for admin
- Toast / Dialog (Radix-based)
- Brand assets (logo SVG) wired in when client provides
