/**
 * index.tsx — Main scrollytelling page: "Vanishing Earth"
 *
 * PAGE STRUCTURE (mirrors the NYT tipping-points article):
 * ┌─────────────────────────────────────┐
 * │  Hero — full-viewport title + intro │
 * ├─────────────────────────────────────┤
 * │  Ecosystem Section 1: Coral Reefs   │
 * │    → Globe (rotated to location)    │
 * │    → Narrative text                 │
 * │    → Key stats                      │
 * ├─────────────────────────────────────┤
 * │  Ecosystem Section 2: Amazon        │
 * │    → (same structure)               │
 * ├─────────────────────────────────────┤
 * │  ... repeat for each ecosystem ...  │
 * ├─────────────────────────────────────┤
 * │  Closing / Credits                  │
 * └─────────────────────────────────────┘
 *
 * Each section is wrapped in <ScrollSection> which handles the
 * Intersection Observer-based visibility detection. The Globe child
 * component receives `isVisible` to trigger its entrance animation.
 *
 * DATA FLOW:
 * ecosystems.ts → map() → ScrollSection + Globe
 */

import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ecosystems } from "~/data/ecosystems";
import { Nav } from "~/components/nav/Nav";
import { Hero } from "~/components/hero/Hero";
import { OverviewGlobe } from "~/components/overview-globe/OverviewGlobe";
import { Globe } from "~/components/globe/Globe";
import { AmazonBranchScene } from "~/components/birds/AmazonBranchScene";
import { BirdLayer } from "~/components/birds/BirdLayer";
import { BrazilMarker } from "~/components/globe/BrazilMarker";
import { GhostDrift } from "~/components/globe/GhostDrift";
import { GrowthHighlight } from "~/components/globe/GrowthHighlight";
import { TemperatureMarker } from "~/components/globe/TemperatureMarker";
import { ScrollSection } from "~/components/scroll-section/ScrollSection";

// ---------------------------------------------------------------------------
// Ecosystem Section — renders one "chapter" of the scrollytelling story
// ---------------------------------------------------------------------------

/**
 * EcosystemSection renders a single tipping-point section.
 * It follows the NYT layout: Globe → Title → Text → Bar → Stats.
 */
const EcosystemSection = component$(
  (props: { ecosystem: (typeof ecosystems)[0]; index: number }) => {
    const eco = props.ecosystem;
    const isVisible = useSignal(false);
    const sectionRef = useSignal<HTMLElement>();

    // Intersection Observer for this individual section's children
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
      const el = sectionRef.value;
      if (!el) return;

      // Matches ScrollSection's own observer threshold (0.15) — kept in sync
      // so inner content (globe/bar/stats) doesn't start animating before
      // the section wrapper itself has begun revealing.
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            isVisible.value = true;
          }
        },
        { threshold: 0.15 },
      );

      observer.observe(el);
      cleanup(() => observer.disconnect());
    });

    return (
      <ScrollSection id={eco.id} color={eco.globe.color}>
        <div ref={sectionRef}>
          {/* ── Globe visualization ──────────────────────────────── */}
          {/*
            w-full max-w-[480px] mx-auto matches the canvas's own sizing
            exactly, so this wrapper's box == the canvas's box at every
            viewport width. Without it, this div spans the full content
            column (e.g. 896px) while the canvas caps at 480px centered
            inside — BirdLayer's percentage-based positions would then be
            calculated against the wrong (much wider) box and never line
            up with the rendered globe.
          */}
          <div class={["relative w-full max-w-[480px] mx-auto", props.index === 0 ? "mb-6" : "mb-12"]}>
            <Globe
              center={eco.globe.center}
              color={eco.globe.color}
              glowColor={eco.globe.glowColor}
              highlightBounds={eco.globe.highlightBounds}
              regions={eco.globe.regions}
              pattern={eco.globe.pattern}
              isVisible={isVisible.value}
            />
            {props.index === 1 && <BirdLayer isVisible={isVisible} />}
            {props.index === 2 && <TemperatureMarker isVisible={isVisible} />}
            {props.index === 4 && <BrazilMarker isVisible={isVisible} />}
            {props.index === 5 && <GhostDrift isVisible={isVisible} />}
            {props.index === 6 && <GrowthHighlight isVisible={isVisible} />}
          </div>

          {/* ── Standalone vignette between globe and title (Section 1 only) —
               deliberately NOT part of the globe overlay, so the globe reads
               as a clean data visualization with nothing perched on it. */}
          {props.index === 0 && (
            <div class="mb-4">
              <AmazonBranchScene isVisible={isVisible} />
            </div>
          )}

          {/* ── Section title & subtitle ─────────────────────────── */}
          <div class="text-center mb-12">
            {/* Section number — small and muted.
                Fixed neutral instead of eco.globe.color: at text-xs size,
                several per-section accent colors (e.g. the old Section 6
                maroon) fall below the 4.5:1 WCAG AA ratio needed for small
                text against bg-slate-950. text-slate-300 passes comfortably
                for all sections; per-section color identity still comes
                through via the globe, stat numbers, and border glow. */}
            <span class="inline-block text-xs font-mono tracking-widest uppercase mb-4 text-slate-300">
              {String(props.index + 1).padStart(2, "0")}
            </span>

            <h2 class="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white leading-tight">
              {eco.name}
            </h2>

            <p class="mt-3 text-lg text-slate-100 italic">
              {eco.subtitle}
            </p>
          </div>

          {/* ── Narrative paragraphs ─────────────────────────────── */}
          <div class="space-y-6 mb-16">
            {eco.paragraphs.map((paragraph, i) => (
              <p
                key={i}
                class={[
                  "text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto",
                  // Stagger paragraph fade-in
                  "transition-all duration-700 ease-out",
                  isVisible.value
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4",
                ]}
                style={{
                  transitionDelay: `${300 + i * 150}ms`,
                }}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* ── Key statistics — three-column callout ────────────── */}
          <div class="flex flex-wrap justify-center gap-6 sm:gap-4 max-w-lg mx-auto">
            {eco.stats.map((stat, i) => (
              <div
                key={i}
                class={[
                  // min-w-[120px] applies at every breakpoint (no
                  // sm:min-w-0 override) so items wrap to a new row instead
                  // of shrinking indefinitely — sections with more than 3
                  // stats (e.g. the 6-stat GDP breakdown) would otherwise
                  // cram every column into one row and overflow into each
                  // other at sm+ widths, since unbreakable strings like
                  // "US$256.6B" can't wrap onto a second line to compensate.
                  "text-center transition-all duration-700 ease-out flex-1 min-w-[120px]",
                  isVisible.value
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4",
                ]}
                style={{
                  transitionDelay: `${550 + i * 120}ms`,
                }}
              >
                <div
                  class={[
                    "font-bold",
                    // Short numeric/percentage values (e.g. "80%", "US$256.6B")
                    // read well as big bold mono type. Longer descriptive
                    // phrases (e.g. "Infrastructure & fiscal planning") were
                    // rendered at the same giant size and wrapped to 3-4
                    // lines, colliding with the neighboring stat column.
                    // Drop to a smaller, non-mono size for those instead.
                    stat.value.length > 16
                      ? "text-base sm:text-lg leading-snug"
                      : "text-2xl sm:text-3xl font-mono",
                  ]}
                  style={{ color: eco.globe.color }}
                >
                  {stat.value}
                </div>
                <div class="text-sm text-slate-100 mt-1 leading-tight">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollSection>
    );
  },
);

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default component$(() => {
  return (
    <main class="bg-slate-950 text-white min-h-screen">
      {/* ── Navigation ────────────────────────────────────────────── */}
      <Nav />

      {/* ── Hero + Overview globe — two-column opening ────────────── */}
      <div class="relative min-h-screen flex flex-col items-stretch pt-16">
        <div class="max-w-6xl mx-auto w-full flex-1 flex flex-col lg:flex-row items-stretch">
          {/* Left: text */}
          <div class="flex-1 flex items-center min-w-0">
            <Hero />
          </div>
          {/* Right: globe */}
          <div class="flex-1 flex items-center justify-center min-w-0 lg:pr-8 pb-32 lg:pb-8">
            <OverviewGlobe />
          </div>
        </div>

        {/* ── Scroll indicator ────────────────────────────────────── */}
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-10">
          <span class="text-[10px] tracking-[0.25em] uppercase text-slate-100 animate-pulse">
            Scroll
          </span>
          {/* Mouse icon with sliding dot */}
          <div class="w-[18px] h-[28px] rounded-full border border-slate-700 flex justify-center pt-[5px]">
            <div
              class="w-[3px] h-[6px] bg-slate-200 rounded-full"
              style={{ animation: "scrollDot 1.8s ease-in-out infinite" }}
            />
          </div>
        </div>
      </div>

      {/* ── Ecosystem sections ────────────────────────────────────── */}
      {ecosystems.map((eco, i) => (
        <EcosystemSection key={eco.id} ecosystem={eco} index={i} />
      ))}

      {/* ── Closing section ───────────────────────────────────────── */}
      <footer class="py-32 px-6 text-center">
        <div class="max-w-2xl mx-auto">
          <h2 class="text-3xl sm:text-4xl font-serif font-bold text-white mb-8">
            The Window Is Closing
          </h2>

          <p class="text-lg text-slate-100 leading-relaxed mb-6">
            These five ecosystems are not isolated crises. They are
            interconnected — the collapse of one accelerates the decline of
            others. Arctic ice loss warms the ocean, which bleaches coral.
            Amazon dieback reduces rainfall, which dries wetlands. Grassland
            conversion releases carbon, which melts more ice.
          </p>

          <p class="text-lg text-slate-100 leading-relaxed mb-12">
            The science is clear about the thresholds. What remains
            uncertain is whether we will act before they are crossed.
          </p>

          {/* ── Summary: all ecosystems at a glance ────────────── */}
          <div class="flex flex-wrap justify-center gap-4 sm:gap-6 max-w-lg mx-auto mb-16">
            {ecosystems.map((eco) => (
              <div key={eco.id} class="flex items-center gap-2">
                <div
                  class="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: eco.globe.color,
                    boxShadow: `0 0 10px ${eco.globe.color}`,
                  }}
                />
                <span class="text-sm text-slate-100 leading-tight">
                  {eco.name}
                </span>
              </div>
            ))}
          </div>

          {/* ── Sources & Credits ─────────────────────────────── */}
          <div class="border-t border-slate-800 pt-8">
            <p class="text-sm text-slate-200 mb-4 uppercase tracking-wider font-medium">
              Data Sources
            </p>
            <ul class="text-sm text-slate-100 leading-relaxed space-y-2 max-w-lg mx-auto list-none p-0">
              <li>
                <a href="https://doi.org/10.1038/s41586-021-03629-6" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors underline decoration-slate-600 underline-offset-2">
                  Gatti et al. 2021, Nature — Amazonia as a carbon source
                </a>
              </li>
              <li>
                <a href="https://bg.copernicus.org/articles/22/5247/2025/" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors underline decoration-slate-600 underline-offset-2">
                  Bourgoin et al. 2025, Biogeosciences — 2024 Amazon fire emissions
                </a>
              </li>
              <li>
                <a href="https://joint-research-centre.ec.europa.eu/jrc-news-and-updates/unprecedented-amazon-fires-2024-fuel-record-co2-emissions-2025-10-08_en" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors underline decoration-slate-600 underline-offset-2">
                  EC Joint Research Centre — Unprecedented Amazon fires 2024 (Oct 2025)
                </a>
              </li>
              <li>
                <a href="https://www.worldweatherattribution.org/climate-change-not-el-nino-main-driver-of-exceptional-drought-in-highly-vulnerable-amazon-river-basin/" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors underline decoration-slate-600 underline-offset-2">
                  World Weather Attribution (Jan 2024) — 2023–24 Amazon drought
                </a>
              </li>
              <li>
                <a href="https://iopscience.iop.org/article/10.1088/1748-9326/aca3b8" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors underline decoration-slate-600 underline-offset-2">
                  Banerjee et al. 2022, Environmental Research Letters — GDP loss/gain modeling
                </a>
              </li>
              <li>
                <a href="https://www.usgs.gov/publications/can-we-avert-amazon-tipping-point-economic-and-environmental-costs" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors underline decoration-slate-600 underline-offset-2">
                  USGS — Can we avert an Amazon tipping point?
                </a>
              </li>
            </ul>
            <p class="text-sm text-slate-100 leading-relaxed max-w-lg mx-auto mt-4">
              Compiled via an internal Ground Truth Document (verified
              claims list, finalized 2026-07-18). Modeled projections above
              are flagged as modeled where they appear.
            </p>
            <p class="text-sm text-slate-200 mt-8">
              Built with Qwik, D3.js, Tailwind CSS, and TopoJSON.
              <br />A Terra Studio capstone project — AI + Storytelling.
            </p>

            {/* Open source credits */}
            <div class="flex flex-wrap items-center justify-center gap-y-2 gap-x-4 mt-6 text-xs text-slate-400">
              <span class="whitespace-nowrap">MIT License · Open Source</span>
              <span aria-hidden="true" class="hidden sm:inline">·</span>
              <a
                href="https://github.com/dsrssntn-a11y/climate-story"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-slate-100 transition-colors whitespace-nowrap"
              >
                GitHub
              </a>
              <span aria-hidden="true" class="hidden sm:inline">·</span>
              <a href="/about" class="hover:text-slate-100 transition-colors whitespace-nowrap">
                About this project
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
});

// ---------------------------------------------------------------------------
// Document Head — SEO and social sharing metadata
// ---------------------------------------------------------------------------

// TODO before deploy:
// 1. og:image / twitter:image still point at the placeholder og-image.svg.
//    Swap in your real image URL once you have it (recommend an absolute
//    https:// URL — most crawlers, including Facebook's and Slack's, won't
//    reliably fetch relative paths or non-public preview URLs).
// 2. og:url is now derived from the live request (`url.href`) rather than
//    hardcoded, so it automatically matches whatever domain this is served
//    from (production Vercel URL, a preview deployment, or localhost) —
//    nothing to fill in here, but confirm your production domain is the one
//    you want indexed once it's live, since Vercel preview URLs will also
//    generate correct-but-not-final og:url values.
export const head: DocumentHead = ({ url }) => ({
  title: "Vanishing Earth — Amazon Council: A Fiscal Responsibility Frame",
  meta: [
    {
      name: "description",
      content:
        "An interactive scrollytelling brief for the Amazon Council: how a tipping point in the Amazon rainforest becomes a fiscal risk — from carbon-sink assumption to a costed case for early action.",
    },
    // Open Graph
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:title",
      content: "Amazon Council — A Fiscal Responsibility Frame",
    },
    {
      property: "og:description",
      content:
        "The Amazon's tipping point, priced: hydropower exposure, modeled GDP loss, and the cost-effective case for acting inside the window.",
    },
    {
      property: "og:url",
      content: url.href,
    },
    {
      // TODO: replace with your real image URL once available.
      property: "og:image",
      content: "https://vanishing-earth.vercel.app/og-image.svg",
    },
    {
      property: "og:image:width",
      content: "1200",
    },
    {
      property: "og:image:height",
      content: "630",
    },
    // Twitter / X
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "twitter:title",
      content: "Amazon Council — A Fiscal Responsibility Frame",
    },
    {
      name: "twitter:description",
      content:
        "The Amazon's tipping point, priced: hydropower exposure, modeled GDP loss, and the cost-effective case for acting inside the window.",
    },
    {
      // TODO: replace with your real image URL once available.
      name: "twitter:image",
      content: "https://vanishing-earth.vercel.app/og-image.svg",
    },
  ],
});
