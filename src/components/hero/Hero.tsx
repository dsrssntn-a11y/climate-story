/**
 * Hero.tsx — Full-viewport opening section for the scrollytelling piece.
 *
 * DESIGN:
 * Mirrors the NYT article's dramatic dark opening with a centered title,
 * subtitle, and a subtle downward scroll indicator. The background uses
 * a radial gradient to create depth against the dark theme.
 *
 * The hero sets the cinematic tone for the entire piece. All styling
 * is pure Tailwind — no custom CSS.
 */

import { component$ } from "@builder.io/qwik";

export const Hero = component$(() => {
  return (
    <header class="relative flex flex-col items-center lg:items-start justify-center text-center lg:text-left px-6 lg:px-12 py-16 overflow-hidden h-full">
      {/* ── Background glow — radial gradient for depth ──────────── */}
      <div
        class="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(30, 58, 138, 0.15) 0%, transparent 60%)",
        }}
      />

      {/* ── Terra Studio logo ────────────────────────────────────── */}
      <img
        src="/data/assets/logos/Terra-studio-light.png"
        alt="Terra Studio"
        class="h-8 mb-8"

      />

      {/* ── Overline label ───────────────────────────────────────── */}


      {/* ── Main title ───────────────────────────────────────────── */}
      <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-none max-w-4xl">
        Vanishing Earth
      </h1>

      {/* ── Subtitle ─────────────────────────────────────────────── */}
      <p class="mt-6 text-lg sm:text-xl md:text-2xl text-slate-300 max-w-2xl leading-relaxed font-light">
        How close are we to losing the planet's most vital ecosystems?
      </p>

      {/* ── Byline ───────────────────────────────────────────────── */}
      <p class="mt-8 text-base text-slate-200">
        A capstone project from the Terra Studio exploring biodiversity tipping points
      </p>

      {/* ── Intro paragraph ──────────────────────────────────────── */}
      <div class="mt-4 max-w-xl text-base text-slate-100 leading-relaxed space-y-4">
        <p>
          Earth's most critical ecosystems — coral reefs, rainforests, polar
          ice, coastal wetlands, and grasslands — are approaching dangerous
          thresholds. Beyond these tipping points, collapse becomes
          self-reinforcing and irreversible.
        </p>
        <p>
          Scroll to explore five ecosystems on the edge.
        </p>
      </div>

    </header>
  );
});
