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
 * │    → Threshold bar                  │
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
 * Intersection Observer-based visibility detection. Child components
 * (Globe, ThresholdBar) receive `isVisible` to trigger animations.
 *
 * DATA FLOW:
 * ecosystems.ts → map() → ScrollSection + Globe + ThresholdBar
 */

import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ecosystems } from "~/data/ecosystems";
import { Nav } from "~/components/nav/Nav";
import { Hero } from "~/components/hero/Hero";
import { OverviewGlobe } from "~/components/overview-globe/OverviewGlobe";
import { Globe } from "~/components/globe/Globe";
import { ThresholdBar } from "~/components/threshold-bar/ThresholdBar";
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

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            isVisible.value = true;
          }
        },
        { threshold: 0.1 },
      );

      observer.observe(el);
      cleanup(() => observer.disconnect());
    });

    return (
      <ScrollSection id={eco.id} color={eco.globe.color}>
        <div ref={sectionRef}>
          {/* ── Globe visualization ──────────────────────────────── */}
          <div class="mb-12">
            <Globe
              center={eco.globe.center}
              color={eco.globe.color}
              glowColor={eco.globe.glowColor}
              highlightBounds={eco.globe.highlightBounds}
              regions={eco.globe.regions}
              pattern={eco.globe.pattern}
              isVisible={isVisible.value}
            />
          </div>

          {/* ── Section title & subtitle ─────────────────────────── */}
          <div class="text-center mb-12">
            {/* Section number — small and muted */}
            <span
              class="inline-block text-xs font-mono tracking-widest uppercase mb-4"
              style={{ color: eco.globe.color }}
            >
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
                  transitionDelay: `${400 + i * 200}ms`,
                }}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* ── Threshold bar ────────────────────────────────────── */}
          <div class="mb-16">
            <ThresholdBar
              label={eco.threshold.label}
              currentValue={eco.threshold.currentValue}
              tippingRange={eco.threshold.tippingRange}
              unit={eco.threshold.unit}
              color={eco.globe.color}
              isVisible={isVisible.value}
            />
          </div>

          {/* ── Key statistics — three-column callout ────────────── */}
          <div class="flex flex-wrap justify-center gap-6 sm:gap-4 max-w-lg mx-auto">
            {eco.stats.map((stat, i) => (
              <div
                key={i}
                class={[
                  "text-center transition-all duration-700 ease-out flex-1 min-w-[120px] sm:min-w-0",
                  isVisible.value
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4",
                ]}
                style={{
                  transitionDelay: `${800 + i * 150}ms`,
                }}
              >
                <div
                  class="text-2xl sm:text-3xl font-bold font-mono"
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
                <a href="https://www.ipbes.net/global-assessment" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors underline decoration-slate-600 underline-offset-2">
                  IPBES Global Assessment (2019)
                </a>
              </li>
              <li>
                <a href="https://www.iucnrle.org/" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors underline decoration-slate-600 underline-offset-2">
                  IUCN Red List of Ecosystems
                </a>
              </li>
              <li>
                <a href="https://livingplanet.panda.org/" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors underline decoration-slate-600 underline-offset-2">
                  WWF Living Planet Report
                </a>
              </li>
              <li>
                <a href="https://www.ipcc.ch/assessment-report/ar6/" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors underline decoration-slate-600 underline-offset-2">
                  IPCC Sixth Assessment Report (AR6)
                </a>
              </li>
              <li>
                <a href="https://www.globalcarbonproject.org/" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors underline decoration-slate-600 underline-offset-2">
                  Global Carbon Project
                </a>
              </li>
              <li>
                <a href="https://gcrmn.net/2020-report/" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors underline decoration-slate-600 underline-offset-2">
                  GCRMN Status of Coral Reefs of the World
                </a>
              </li>
              <li>
                <a href="https://nsidc.org/" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors underline decoration-slate-600 underline-offset-2">
                  National Snow and Ice Data Center (NSIDC)
                </a>
              </li>
              <li>
                <a href="https://www.globalmangrovewatch.org/" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors underline decoration-slate-600 underline-offset-2">
                  Global Mangrove Watch
                </a>
              </li>
              <li>
                <a href="https://www.science.org/doi/10.1126/science.abn7950" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors underline decoration-slate-600 underline-offset-2">
                  Armstrong McKay et al. — Exceeding 1.5°C could trigger multiple tipping points (Science, 2022)
                </a>
              </li>
            </ul>
            <p class="text-sm text-slate-200 mt-8">
              Built with Qwik, D3.js, Tailwind CSS, and TopoJSON.
              <br />A Terra Studio capstone project — AI + Storytelling.
            </p>

            {/* Open source credits */}
            <div class="flex flex-wrap items-center justify-center gap-y-2 gap-x-4 mt-6 text-xs text-slate-600">
              <span class="whitespace-nowrap">MIT License · Open Source</span>
              <span aria-hidden="true" class="hidden sm:inline">·</span>
              <a
                href="https://github.com/bodhicodes/vanishing-earth-climate-storytelling"
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

export const head: DocumentHead = {
  title: "Vanishing Earth — How Close Are We to Losing the Planet's Most Vital Ecosystems?",
  meta: [
    {
      name: "description",
      content:
        "An interactive scrollytelling exploration of five ecosystems approaching dangerous tipping points: coral reefs, the Amazon, Arctic ice, mangroves, and grasslands.",
    },
    // Open Graph
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:title",
      content: "Vanishing Earth — Biodiversity Tipping Points",
    },
    {
      property: "og:description",
      content:
        "Scroll through five ecosystems on the edge of collapse. A data-driven visual story.",
    },
    {
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
      content: "Vanishing Earth — Biodiversity Tipping Points",
    },
    {
      name: "twitter:description",
      content:
        "Scroll through five ecosystems on the edge of collapse. A data-driven visual story.",
    },
    {
      name: "twitter:image",
      content: "https://vanishing-earth.vercel.app/og-image.svg",
    },
  ],
};
