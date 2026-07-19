# Vanishing Earth — An Interactive Climate Story

A scrollytelling interactive built as part of **[Terra Studio](https://www.terra.do/studio)** — Terra.do's intensive program for climate professionals who want to communicate science with clarity and impact.

This project is the capstone of **Module 6: The Interactive Climate Story**, where participants build editorial-tier scrollytelling interactives — the format used by the NYT, Guardian, and Bloomberg for their most compelling climate journalism.

**Open source.** Use it, fork it, learn from it, build your own version with your own data.

---

## What It Is

*Vanishing Earth* explores five ecosystems approaching dangerous tipping points: coral reefs, the Amazon rainforest, Arctic sea ice, mangroves and coastal wetlands, and grasslands and savannas. Each section combines a D3-powered globe visualization with narrative text, an animated threshold bar showing proximity to the tipping point, and key statistics — all triggered as you scroll.

The piece is designed as a reference implementation for Terra Studio participants: a fully working example of what you can build in Module 6, with every design and data decision documented in the code comments.

---

## The Terra Studio Context

Terra Studio is built around one idea: climate professionals who can communicate — clearly, credibly, and with narrative force — change more minds than those who can't. The six-module curriculum moves from data literacy and framing to visual communication, AI collaboration, and finally this: a public interactive that demonstrates everything.

Module 6 is optional and ambitious. It assumes comfort with Claude Code or a willingness to direct AI through code generation in a terminal. The expected output is a scrollytelling interactive at a public URL, built from your own climate data and your own story.

This repository is the worked example. The code is intentionally over-commented — every component explains *why* it's built the way it is, connecting back to the course concepts.

---

## Using This as a Starting Point

If you're a Terra Studio participant building your own piece, the one file you need to edit is:

```
src/data/ecosystems.ts
```

This is the single source of truth for all content — ecosystems, narrative paragraphs, globe configurations, threshold data, and statistics. Replace the five ecosystems with your own data, and the entire page updates automatically. The inline comments walk through every field.

Everything else — the scroll mechanics, globe rendering, animations, layout — is already built.

---

## Tech Stack

- **[Qwik](https://qwik.dev/) + Qwik City** — SSR framework with fine-grained lazy loading
- **[D3.js](https://d3js.org/) + TopoJSON** — Canvas-based orthographic globe rendering
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Utility-first styling
- **[Vercel Edge](https://vercel.com/docs/functions/edge-functions)** — Edge-rendered deployment

---

## Local Development

```shell
# Install dependencies
pnpm install

# Start dev server (SSR mode)
pnpm dev

# Type check
pnpm build.types

# Production build
pnpm build
```

The dev server runs at `http://localhost:5173`.

---

## Project Structure

```
src/
├── routes/
│   └── index.tsx          # Main page — layout and section assembly
├── components/
│   ├── hero/              # Full-viewport opening section
│   ├── nav/               # Fixed navigation bar
│   ├── overview-globe/    # Auto-rotating globe showing all ecosystems
│   ├── globe/             # Per-ecosystem D3 canvas globe
│   ├── threshold-bar/     # Animated tipping-point range bar
│   └── scroll-section/    # Intersection Observer scroll wrapper
├── data/
│   └── ecosystems.ts      # ← Edit this file with your own data
└── global.css             # Minimal global styles (Tailwind + keyframes)
public/
└── data/
    ├── world-110m.json    # TopoJSON world topology
    └── assets/logos/      # Terra.do and Terra Studio logos
```

---

## Deployment

The project is pre-configured for [Vercel Edge](https://vercel.com/docs/functions/edge-functions).

```shell
# Deploy to Vercel
pnpm deploy
```

Or connect the repository to Vercel via the dashboard for automatic deploys on push.

---

## Dataset Download

The tipping-point and status data is published as a standalone dataset — free to use in your own projects, analyses, or visualizations:

- [`public/data/ecosystems.json`](public/data/ecosystems.json) — full dataset with thresholds, stats, geographic region polygons, and per-ecosystem source citations
- [`public/data/ecosystems.csv`](public/data/ecosystems.csv) — flat tabular version (one row per metric) for spreadsheets, Python, R, or Observable

Both files are MIT licensed and include inline source attribution.

---

## Data Sources

The climate data in this reference implementation is sourced from peer-reviewed literature and authoritative datasets:

- [IPBES Global Assessment (2019)](https://www.ipbes.net/global-assessment)
- [IUCN Red List of Ecosystems](https://www.iucnrle.org/)
- [WWF Living Planet Report](https://livingplanet.panda.org/)
- [IPCC Sixth Assessment Report (AR6)](https://www.ipcc.ch/assessment-report/ar6/)
- [Global Carbon Project](https://www.globalcarbonproject.org/)
- [GCRMN Status of Coral Reefs of the World](https://gcrmn.net/2020-report/)
- [National Snow and Ice Data Center (NSIDC)](https://nsidc.org/)
- [Global Mangrove Watch](https://www.globalmangrovewatch.org/)
- Armstrong McKay et al. — [Exceeding 1.5°C could trigger multiple tipping points](https://www.science.org/doi/10.1126/science.abn7950) *(Science, 2022)*

---

## License

MIT. Built by [Terra Studio](https://www.terra.do/studio) as open-source educational material.
