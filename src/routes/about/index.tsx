/**
 * about/index.tsx — About This Project page.
 *
 * Repurposes the README as a readable, on-brand page.
 * Linked from the nav and from the project footer.
 */

import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import ImgTerradoLogo from "~/media/data/assets/logos/Terra.do Logo.webp?jsx";

export default component$(() => {
  return (
    <main class="bg-slate-950 text-white min-h-screen">
      {/* ── Nav ───────────────────────────────────────────────────── */}
      <nav class="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div class="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" class="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
            <ImgTerradoLogo alt="Terra.do" class="h-8 w-auto" />
          </a>
          <div class="flex items-center gap-6">
            <a href="/" class="text-sm text-slate-100 hover:text-white transition-colors">
              ← Back to Story
            </a>
          </div>
        </div>
      </nav>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div class="max-w-3xl mx-auto px-6 pt-32 pb-24">

        {/* Header */}
        <div class="mb-16">
          <p class="text-xs tracking-[0.3em] uppercase text-slate-200 mb-4 font-medium">
            Terra Studio · Module 6
          </p>
          <h1 class="text-4xl sm:text-5xl font-serif font-bold text-white  mb-6">
            Vanishing Earth
          </h1>
          <p class="text-xl text-slate-100 leading-relaxed">
            An open-source scrollytelling interactive built as a reference implementation for{" "}
            <a href="https://www.terra.do/studio" target="_blank" rel="noopener noreferrer" class="text-white underline underline-offset-4 decoration-slate-600 hover:decoration-white transition-colors">
              Terra Studio
            </a>
            {" "}— Terra.do's program for climate professionals who want to communicate science with clarity and impact.
          </p>
        </div>

        <hr class="border-slate-800 mb-16" />

        {/* What it is */}
        <section class="mb-14">
          <h2 class="text-xl font-semibold text-white mb-4">What It Is</h2>
          <p class="text-slate-100 leading-relaxed mb-4">
            This piece explores five ecosystems approaching dangerous tipping points: coral reefs, the Amazon rainforest, Arctic sea ice, mangroves and coastal wetlands, and grasslands and savannas. Each section combines a D3-powered globe visualization with narrative text and key statistics — all triggered as you scroll.
          </p>
          <p class="text-slate-100 leading-relaxed">
            It's designed as a reference implementation for Terra Studio participants: a fully working example of what you can build in Module 6, with every design and data decision documented in the code comments.
          </p>
        </section>

        {/* Terra Studio context */}
        <section class="mb-14">
          <h2 class="text-xl font-semibold text-white mb-4">The Terra Studio Context</h2>
          <p class="text-slate-100 leading-relaxed mb-4">
            Terra Studio is built around one idea: climate professionals who can communicate — clearly, credibly, and with narrative force — change more minds than those who can't. The six-module curriculum moves from data literacy and framing to visual communication, AI collaboration, and finally this: a public interactive that demonstrates everything.
          </p>
          <p class="text-slate-100 leading-relaxed">
            Module 6 is optional and ambitious. It assumes comfort with Claude Code or a willingness to direct AI through code generation in a terminal. The expected output is a scrollytelling interactive at a public URL, built from your own climate data and your own story. This project is the worked example.
          </p>
        </section>

        {/* Open source / fork it */}
        <section class="mb-14">
          <h2 class="text-xl font-semibold text-white mb-4">Open Source — Fork It</h2>
          <p class="text-slate-100 leading-relaxed mb-6">
            The entire codebase is open source under the MIT license. If you're a Terra Studio participant building your own piece, the one file you need to edit is{" "}
            <code class="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">src/data/ecosystems.ts</code>
            {" "}— the single source of truth for all content. Replace the sections with your own data and the entire page updates automatically.
          </p>
          <a
            href="https://github.com/dsrssntn-a11y/climate-story"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-200 hover:text-white transition-colors text-sm font-medium"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
            </svg>
            View on GitHub
          </a>
        </section>

        {/* Tech stack */}
        <section class="mb-14">
          <h2 class="text-xl font-semibold text-white mb-4">Tech Stack</h2>
          <div class="grid grid-cols-2 gap-3">
            {[
              { name: "Qwik + Qwik City", desc: "SSR framework with fine-grained lazy loading" },
              { name: "D3.js + TopoJSON", desc: "Canvas-based orthographic globe rendering" },
              { name: "Tailwind CSS v4", desc: "Utility-first styling" },
              { name: "Vercel Edge", desc: "Edge-rendered deployment" },
            ].map((item) => (
              <div key={item.name} class="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
                <div class="text-sm font-medium text-slate-200 mb-1">{item.name}</div>
                <div class="text-xs text-slate-200">{item.desc}</div>
              </div>
            ))}
          </div>

        </section>

        {/* Data sources */}
        <section class="mb-14">
          <h2 class="text-xl font-semibold text-white mb-4">Data Sources</h2>
          <ul class="space-y-2">
            {[
              { label: "Gatti et al. 2021, Nature — Amazonia as a carbon source linked to deforestation and climate change", href: "https://doi.org/10.1038/s41586-021-03629-6" },
              { label: "Bourgoin et al. 2025, Biogeosciences — 2024 Amazon fire emissions", href: "https://bg.copernicus.org/articles/22/5247/2025/" },
              { label: "EC Joint Research Centre — Unprecedented Amazon fires 2024 fuel record CO2 emissions (Oct 2025)", href: "https://joint-research-centre.ec.europa.eu/jrc-news-and-updates/unprecedented-amazon-fires-2024-fuel-record-co2-emissions-2025-10-08_en" },
              { label: "World Weather Attribution (Jan 2024) — Climate change, not El Niño, main driver of exceptional Amazon drought", href: "https://www.worldweatherattribution.org/climate-change-not-el-nino-main-driver-of-exceptional-drought-in-highly-vulnerable-amazon-river-basin/" },
              { label: "Banerjee et al. 2022, Environmental Research Letters — Amazon tipping point GDP loss/gain modeling", href: "https://iopscience.iop.org/article/10.1088/1748-9326/aca3b8" },
              { label: "USGS — Can we avert an Amazon tipping point? Economic and environmental costs", href: "https://www.usgs.gov/publications/can-we-avert-amazon-tipping-point-economic-and-environmental-costs" },
              { label: "Saleska et al. 2023, Atmospheric Chemistry and Physics — Atmospheric CO2 inversion reveals the Amazon as a minor carbon source", href: "https://acp.copernicus.org/articles/23/9685/2023/" },
              { label: "MAAP #220 (2024) — Amazon Conservation report on carbon loss/gain cases in the Amazon", href: "https://www.amazonconservation.org/new-maap-report-covers-key-cases-of-carbon-loss-gain-in-the-amazon/" },
            ].map((source) => (
              <li key={source.href}>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm text-slate-100 hover:text-white transition-colors underline decoration-slate-700 underline-offset-2 hover:decoration-slate-400"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
          <p class="text-slate-100 leading-relaxed mt-4">
            Compiled via an internal Ground Truth Document (verified claims
            list, finalized 2026-07-18). Modeled projections above are
            flagged as modeled at the point they're used.
          </p>
        </section>

        <hr class="border-slate-800 mb-10" />

        {/* Footer */}
        <div class="flex items-center justify-between text-sm text-slate-100">
          <span>MIT License · Open Source</span>
          <a
            href="https://www.terra.do/studio"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-slate-100 transition-colors"
          >
            terra.do/studio
          </a>
        </div>
      </div>
    </main>
  );
});

export const head: DocumentHead = {
  title: "About — Vanishing Earth · Terra Studio",
  meta: [
    {
      name: "description",
      content:
        "About the Vanishing Earth scrollytelling interactive — an open-source reference implementation built for Terra Studio's Module 6.",
    },
  ],
};
