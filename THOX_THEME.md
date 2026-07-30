# ThoxHermes — THOX.ai design system

ThoxHermes-webui and ThoxHermes-studio share **one** THOX.ai design system so the
end-user chat UI (this repo) and the builder/studio surface read as one product.

## The shared token layer

The single source of truth is a set of `--thox-*` CSS custom properties. In this
repo they live at the top of [`static/thox-theme.css`](static/thox-theme.css); the
identical token set is applied in ThoxHermes-studio's client (`thox-tokens`). Any
change to the palette happens in the token block, not in ad-hoc hexes.

| Token | Value | Use |
|---|---|---|
| `--thox-emerald-500` | `#10B981` | primary accent (buttons, links, active, focus) |
| `--thox-emerald-400` | `#34D399` | hover / on-dark accent |
| `--thox-emerald-700` | `#047857` | light-mode accent |
| `--thox-neon` | `#00FF88` | glow / emphasis only |
| `--thox-bg` | `#09090B` | canvas (zinc-950) |
| `--thox-surface` | `#18181B` | panels (zinc-900) |
| `--thox-elevated` | `#27272A` | elevated (zinc-800) |
| `--thox-border` / `--thox-border-strong` | `#27272A` / `#3F3F46` | borders |
| `--thox-text` / `-muted` / `-faint` | `#FAFAFA` / `#A1A1AA` / `#71717A` | text |
| `--thox-info` / `-warn` / `-danger` | `#38BDF8` / `#FBBF24` / `#F87171` | semantic |
| `--thox-font-sans` | `Inter` | body / UI |
| `--thox-font-mono` | `JetBrains Mono` | code / telemetry |

**Purple (`#a855f7`) is reserved for MagStack** and is never used here.

## How it plugs into hermes-webui

hermes-webui splits appearance into a **Theme** axis (dark/light/system, the `.dark`
class) and a **Skin** axis (the `--accent` family, `data-skin` attribute) — see
[`THEMES.md`](THEMES.md). THOX ships as a **full skin** named `thox` that maps the
tokens above onto hermes-webui's own variables **and** overrides the base surface /
text tokens, so the whole surface becomes zinc + emerald (not just the accent).

- `static/thox-theme.css` — the token block + `:root[data-skin="thox"]` (light) and
  `:root.dark[data-skin="thox"]` (dark) + component polish (emerald focus rings,
  neon-lifted primary/send, emerald active-session rail).
- Registered in `static/boot.js` (`_SKINS`, first entry → drives the Appearance
  picker and the `/theme` command) and `static/index.html` (skin validation map).
- **THOX is the default** (dark theme + `thox` skin out of the box). Users can still
  switch Theme/Skin freely; the choice persists via `localStorage` + `/api/settings`.

Switch any time: Settings → Appearance, or `/theme thox` in the composer.

## WCAG

`#FAFAFA` on `#09090B` = 19:1 (AAA). `#10B981` on `#09090B` ≈ 5.8:1 (AA). Emerald
focus rings are 2px with a 2px offset. Both light and dark variants are defined so
the skin reads cleanly on either theme.
