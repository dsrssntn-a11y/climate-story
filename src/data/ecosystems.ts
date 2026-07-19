/**
 * ecosystems.ts — Core data for the "Vanishing Earth" scrollytelling piece.
 *
 * Each ecosystem entry mirrors the structure of the NYT tipping-points article:
 * a narrative section with a D3 globe visualization and key statistics.
 *
 * Students: This file is the single source of truth for all section content.
 * To add a new ecosystem, copy an existing entry and update the fields.
 *
 * SOURCING FOR THIS DATASET (Amazon Council / Fiscal Responsibility Frame):
 * Source boundary — Ground Truth Document, expanded and finalized 2026-07-18
 * ("Ground Truth Document — Amazon Carbon Source", 6 claims total, audience:
 * Amazon Region Government Council). All figures are drawn from that
 * verified claims list; modeled projections (Claims 4 and 5) are flagged as
 * modeled at the point of use rather than presented as observed fact.
 *
 * Claim numbers vs. section numbers are two different sequences — the GTD
 * has 6 claims (1–6); this piece has 7 narrative sections. The document's
 * hero metric is explicitly Claim 5 ("Fiscal Resolution") — there is no
 * "Claim 7". Section-to-claim mapping (see per-section "Source:" comments
 * below for full citations):
 *   Section 1 (Once upon a time)   — framing/context, not a single claim
 *   Section 2 (Every day)          — framing/context, not a single claim
 *   Section 3 (Until one day)      — Claim 1 (revised) + Claim 2 + the
 *                                     Contextual Note (Gatti/Saleska/MAAP)
 *   Section 4 (Because of that 1)  — Claim 3
 *   Section 5 (Because of that 2)  — Claim 4
 *   Section 6 (Because of that 3)  — Claim 6
 *   Section 7 (Until finally)      — Claim 5 (the document's hero metric)
 *
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EcosystemStat {
  label: string;
  value: string;
}

/**
 * A geographic polygon that traces the actual boundary of an ecosystem.
 * Used to draw NYT-style hatched regions on the globe canvas.
 *
 * Unlike simple bounding boxes, these follow real geography — the Amazon
 * polygon traces the basin, coral rings follow reef belts, etc.
 */
export interface EcosystemRegion {
  /** GeoJSON-style coordinate ring: [[lon, lat], ...] — must be closed */
  coordinates: [number, number][];
}

/**
 * Controls the visual hatching pattern drawn inside each region polygon.
 * Different angles and spacings give each ecosystem a unique visual identity,
 * mirroring the NYT approach (horizontal for forests, diagonal for coral, etc.)
 */
export interface PatternConfig {
  /** Line angle in degrees: 0° = horizontal, 90° = vertical, 45° = diagonal */
  angle: number;
  /** Pixel gap between hatch lines (smaller = denser) */
  spacing: number;
  /** Stroke width of each hatch line */
  lineWidth: number;
}

export interface GlobeConfig {
  /** [longitude, latitude] center point for the orthographic projection */
  center: [number, number];
  /** Accent color used for region highlights and glow effects (hex) */
  color: string;
  /** Secondary glow color for ambient lighting */
  glowColor: string;
  /**
   * Bounding box for backward compat: [[west, south], [east, north]].
   * Regions (below) are used for rendering; bounds kept for radial glow.
   */
  highlightBounds: [[number, number], [number, number]];
  /**
   * Geographic polygons that trace real ecosystem boundaries.
   * Each region is rendered as a hatched area on the globe canvas.
   * Multiple regions per ecosystem are supported (e.g., Caribbean + Indo-Pacific coral).
   */
  regions: EcosystemRegion[];
  /** Hatching pattern style for this ecosystem */
  pattern: PatternConfig;
}

export interface Ecosystem {
  /** Unique slug used for scroll anchoring and keys */
  id: string;
  /** Display title, e.g. "Coral Reefs" */
  name: string;
  /** One-line subtitle shown below the title */
  subtitle: string;
  /** Narrative paragraphs — keep to 2-3 for pacing */
  paragraphs: string[];
  /** Globe rotation & highlight config */
  globe: GlobeConfig;
  /** Key stats shown as callout numbers */
  stats: EcosystemStat[];
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export const ecosystems: Ecosystem[] = [
  // ── Section 1: Amazon Council / Fiscal Responsibility Frame ─────────────
  // Story Spine beat: Once upon a time
  // Framing/context — establishes the pre-Claim-1 assumption (Amazon as a
  // permanent carbon sink). Not itself drawn from a single GTD claim.
  {
    id: "amazon-council-fiscal-responsibility-frame",
    name: "Amazon Council / Fiscal Responsibility Frame",
    subtitle: "The Amazon our Carbon Reservoir",
    paragraphs: [
      "The Amazon was understood as one of Earth's great carbon sinks — a permanent ecological asset.",
      "For regional governments, that baseline had fiscal meaning: the forest was performing regulatory work that didn't appear on any budget line, and planning could proceed as though it always would.",
    ],
    globe: {
      center: [-62, -5], // Central Amazon basin — establishing shot
      color: "#2D6A4F", // Calm, stable forest green
      glowColor: "#74C69D",
      highlightBounds: [
        [-74, -14],
        [-50, 2],
      ],
      regions: [
        {
          coordinates: [
            [-74, 0], [-72, 2], [-70, 4], [-67, 4], [-64, 3],
            [-60, 2], [-57, 1], [-54, 0], [-52, -2], [-50, -4],
            [-50, -7], [-52, -9], [-55, -12], [-58, -14], [-62, -14],
            [-66, -13], [-69, -11], [-72, -8], [-74, -5], [-75, -2],
            [-74, 0],
          ],
        },
      ],
      pattern: { angle: 0, spacing: 6, lineWidth: 0.7 }, // calm horizontal, sparse
    },
    stats: [
      { label: "Status", value: "Established carbon sink" },
      { label: "Fiscal treatment", value: "Off balance sheet" },
    ],
  },

  // ── Section 2: Is This a Constant? ───────────────────────────────────────
  // Story Spine beat: Every day
  // Framing/context — same pre-Claim-1 assumption, extended to
  // infrastructure/fiscal planning. Not itself drawn from a single GTD claim.
  {
    id: "static-assumption",
    name: "Is This a Constant?",
    subtitle: "The Static Assumption",
    paragraphs: [
      "Infrastructure was approved, energy systems designed, and fiscal frameworks built against that assumption of constancy.",
      "The Amazon's stability was treated as a fixed input — not a managed asset with its own risk exposure, not a variable that could move against the budget.",
    ],
    globe: {
      center: [-62, -5], // Same basin-wide view — assumption still holds region-wide
      color: "#3E7C4A", // Slightly more muted green — quiet pressure building
      glowColor: "#7FB585",
      highlightBounds: [
        [-74, -14],
        [-50, 2],
      ],
      regions: [
        {
          coordinates: [
            [-74, 0], [-72, 2], [-70, 4], [-67, 4], [-64, 3],
            [-60, 2], [-57, 1], [-54, 0], [-52, -2], [-50, -4],
            [-50, -7], [-52, -9], [-55, -12], [-58, -14], [-62, -14],
            [-66, -13], [-69, -11], [-72, -8], [-74, -5], [-75, -2],
            [-74, 0],
          ],
        },
      ],
      pattern: { angle: 0, spacing: 5, lineWidth: 0.75 }, // still calm, slightly denser
    },
    stats: [
      { label: "Assumption embedded in", value: "Infrastructure & fiscal planning" },
      { label: "Treated as", value: "Fixed input, not a risk variable" },
    ],
  },

  // ── Section 3: The Old Story Breaks ──────────────────────────────────────
  // Story Spine beat: Until one day
  // Source: Ground Truth Document, Claim 2 (Confirmed) — 791M±86M tonnes CO2,
  //   sevenfold increase, fire surpassed deforestation for first time on
  //   record. Bourgoin et al. 2025, Biogeosciences (doi:10.5194/bg-22-5247-2025);
  //   EC Joint Research Centre press release, Oct 2025.
  // + Claim 1 (Revised) — Gatti et al. 2021, Nature (doi:10.1038/s41586-021-03629-6).
  //   GTD notes this as basin-wide-overstated if unqualified; "has not
  //   uniformly flipped" phrasing below reflects that revision.
  // + Contextual Note (three-source synthesis behind "three independent
  //   studies converge"): Gatti et al. 2021 (Nature); Saleska et al. 2023,
  //   Atmospheric Chemistry and Physics, "Atmospheric CO2 inversion reveals
  //   the Amazon as a minor carbon source" (acp.copernicus.org/articles/23/9685/2023/);
  //   MAAP #220 (2024), via Amazon Conservation
  //   (amazonconservation.org/new-maap-report-covers-key-cases-of-carbon-loss-gain-in-the-amazon/).
  {
    id: "its-complicated",
    name: "The Old Story Breaks",
    subtitle: "It's not immune to climate change",
    paragraphs: [
      "Parts of the Amazon are already functioning as net carbon sources. In 2024, fire-driven degradation alone released an estimated 791 million metric tons of carbon dioxide (CO₂) — a sevenfold increase from the previous two years — and for the first time on record surpassed deforestation as the primary driver of Amazon carbon emissions.",
      "The basin as a whole has not uniformly flipped, but the margin is narrow and the trend is adverse. Three independent studies using different methods and geographic scopes converge on the same direction: the Amazon's carbon balance is under compounding stress.",
    ],
    globe: {
      center: [-56, -10], // Southeastern "arc of deforestation" — Mato Grosso/Rondônia/Pará
      color: "#D97706", // Warning amber — the discovery moment
      glowColor: "#F0A94E",
      highlightBounds: [
        [-65, -16],
        [-48, -4],
      ],
      regions: [
        {
          coordinates: [
            [-58, -4], [-54, -3], [-50, -4], [-48, -7],
            [-49, -10], [-52, -13], [-56, -15], [-60, -14],
            [-62, -11], [-61, -8], [-59, -6], [-58, -4],
          ],
        },
      ],
      pattern: { angle: 30, spacing: 5, lineWidth: 0.8 }, // unease creeping in
    },
    stats: [
      { label: "Fire-driven CO₂ emissions (2024)", value: "791M tonnes" },
      { label: "Increase vs. prior two years", value: "7×" },
      { label: "Independent studies confirming trend", value: "3" },
    ],
  },

  // ── Section 4: Drought on the Grid ───────────────────────────────────────
  // Story Spine beat: Because of that (1)
  // Source: Ground Truth Document, Claim 3 (Confirmed) — hydropower shares
  //   and June 2023 power cuts. World Weather Attribution, Jan 2024
  //   (rapid-attribution study using peer-reviewed methods, not a journal
  //   article) — worldweatherattribution.org (see about page for full link).
  //   GTD caveat: the hydropower percentages themselves originate from
  //   USAID data cited inside the WWA report, not independently verified by
  //   WWA — flagged here per the source document's own note.
  {
    id: "drought-on-the-grid",
    name: "Drought on the Grid",
    subtitle: "When forest loss becomes an energy risk",
    paragraphs: [
      "The infrastructure the region depends on became directly exposed. Amazon countries generate the majority of their electricity from hydropower — Brazil at 80%, Colombia at 79%, Ecuador and Peru at 55% each, and Bolivia at 32%.",
      "The 2023–24 drought pushed dam capacities toward their limits and triggered power cuts as early as June 2023. Energy stability, long assumed as fixed, is now a variable tied directly to forest and climate conditions.",
    ],
    globe: {
      center: [-70, -6], // Spans Andean-Amazon interface — Peru, Ecuador, Colombia, Brazil
      color: "#C2410C", // Burnt orange — drought & grid strain
      glowColor: "#E8792B",
      highlightBounds: [
        [-79, -18],
        [-48, 4],
      ],
      regions: [
        {
          coordinates: [
            [-78, 2], [-74, 4], [-70, 4], [-65, 3], [-60, 2],
            [-55, 0], [-50, -3], [-48, -6], [-50, -9],
            [-55, -12], [-62, -13], [-70, -12], [-76, -9],
            [-79, -4], [-78, 2],
          ],
        },
      ],
      pattern: { angle: 45, spacing: 4, lineWidth: 0.9 }, // steeper diagonal, denser — risk
    },
    stats: [
      { label: "Brazil electricity from hydropower", value: "80%" },
      { label: "Colombia electricity from hydropower", value: "79%" },
      { label: "Ecuador & Peru hydropower share", value: "55% each" },
      { label: "Bolivia electricity from hydropower", value: "32%" },
    ],
  },

  // ── Section 5: The Price Tag, Oof ────────────────────────────────────────
  // Story Spine beat: Because of that (2)
  // Source: Ground Truth Document, Claim 4 (Confirmed, modeled projection) —
  //   $256.6B cumulative regional GDP loss through 2050 (Brazil $184.1B,
  //   Peru $35.3B, Colombia $17.6B, Bolivia $11.4B, Ecuador $8.2B).
  //   Banerjee et al. 2022, Environmental Research Letters
  //   (doi:10.1088/1748-9326/aca3b8); also indexed via USGS publication
  //   record. Modeled via the IEEM Platform, 2019 base year — flag as a
  //   conservative lower-bound estimate, not a direct measurement.
  {
    id: "the-price-tag",
    name: "The Price Tag, Oof",
    subtitle: "Brazil bears most of the loss",
    paragraphs: [
      "The financial exposure compounds. A conservative modeled estimate puts the cumulative regional Gross Domestic Product (GDP) loss from crossing an Amazon tipping point at US$256.6 billion through 2050, across Brazil, Peru, Colombia, Bolivia, and Ecuador.",
      "Brazil alone accounts for US$184.1 billion of that projected loss.",
    ],
    globe: {
      center: [-52, -10], // Brazil-centric — where most of the projected loss lands
      color: "#B91C1C", // Fiscal alarm red
      glowColor: "#E05252",
      highlightBounds: [
        [-70, -18],
        [-42, 0],
      ],
      regions: [
        {
          coordinates: [
            [-68, 2], [-64, 3], [-60, 2], [-56, 1], [-52, -1],
            [-50, -4], [-49, -7], [-51, -10], [-55, -13],
            [-60, -13], [-65, -11], [-68, -8], [-70, -4], [-68, 2],
          ],
        },
      ],
      pattern: { angle: 60, spacing: 3.5, lineWidth: 1.0 }, // dense, urgent
    },
    stats: [
      { label: "Cumulative regional GDP loss (to 2050, modeled)", value: "US$256.6B" },
      { label: "Brazil's share of projected loss (modeled)", value: "US$184.1B" },
      { label: "Peru's share of projected loss (modeled)", value: "US$35.3B" },
      { label: "Colombia's share of projected loss (modeled)", value: "US$17.6B" },
      { label: "Bolivia's share of projected loss (modeled)", value: "US$11.4B" },
      { label: "Ecuador's share of projected loss (modeled)", value: "US$8.2B" },
    ],
  },

  // ── Section 6: Ghost in the Books ─────────────────────────────────────────
  // Story Spine beat: Because of that (3)
  // Source: Ground Truth Document, Claim 6 (Confirmed, qualitative finding) —
  //   fire-driven degradation undercounted/missed in national accounting and
  //   international policy frameworks. Same source as Claim 2: Bourgoin et
  //   al. 2025, Biogeosciences (doi:10.5194/bg-22-5247-2025); EC Joint
  //   Research Centre, Oct 2025. GTD caveat: avoid absolute phrasing — the
  //   finding is that degradation is "frequently" missed, not universally
  //   invisible to accounting systems.
  {
    id: "ghost-in-the-books",
    name: "Ghost in the Books",
    subtitle: "The damage is bigger than the books show",
    paragraphs: [
      "The liability is growing in ways that may not yet be fully visible in official figures. Fire-driven degradation — now the primary emissions driver — is frequently undercounted or missed in national accounting systems and may not be consistently captured by international policy frameworks.",
      "Degraded forests lose significant biomass and ecological function while appearing intact from above, which means material ecological liability can accumulate before it registers in official figures.",
    ],
    globe: {
      center: [-58, -9], // Same arc-of-deforestation zone — the hidden liability
      // Lightened from the original #5B2333 — that dark maroon rendered at
      // ~1.7:1 contrast against the page background (bg-slate-950 #020617),
      // failing WCAG AA even for large bold text (needs 3:1). #C2607D keeps
      // the maroon/rose "hidden liability" tone at ~5:1 contrast.
      color: "#C2607D",
      glowColor: "#E3A8BC",
      highlightBounds: [
        [-68, -16],
        [-46, -2],
      ],
      regions: [
        {
          coordinates: [
            [-60, -2], [-56, -2], [-52, -3], [-49, -6],
            [-48, -9], [-50, -12], [-54, -15], [-59, -16],
            [-63, -14], [-64, -10], [-62, -6], [-60, -2],
          ],
        },
      ],
      pattern: { angle: -45, spacing: 3, lineWidth: 1.0 }, // cross-diagonal, densest — hidden crisis
    },
    stats: [
      { label: "Primary emissions driver", value: "Fire-driven degradation" },
      { label: "Accounting visibility", value: "Undercounted / off-ledger" },
      { label: "Canopy status", value: "Appears intact from above" },
    ],
  },

  // ── Section 7: The Better Bet ─────────────────────────────────────────────
  // Story Spine beat: Until finally
  // Source: Ground Truth Document, Claim 5 — ★ THE DOCUMENT'S HERO METRIC
  //   ("Fiscal Resolution"). $339.3B additional regional wealth, $29.5B
  //   public investment return, both projected through 2050. Banerjee et
  //   al. 2022, Environmental Research Letters (doi:10.1088/1748-9326/aca3b8) —
  //   same model/base year as Claim 4 (IEEM Platform, 2019 base year).
  //   Modeled projection, not a realized figure. This is the claim the GTD
  //   says "anchors the council resolution beat of the Story Spine" — i.e.
  //   this section. There is no "Claim 7" in the source document.
  {
    id: "the-better-bet",
    name: "The Better Bet",
    subtitle: "Spend less, gain more",
    paragraphs: [
      "The same modeling that produced the loss figure also produced its inverse. Strategies to avert the tipping point — reducing deforestation, improving fire management, investing in climate-adapted agriculture — are projected to generate US$339.3 billion in additional regional wealth.",
      "The estimated public investment return is US$29.5 billion. This is not a cost to the council. The evidence in Claims 4 and 5 shows acting within the available window is more cost-effective than responding after.",
    ],
    globe: {
      center: [-65, -8], // Pulls back to the full 5-country region — shared upside
      color: "#1B7A5A", // Hopeful teal-green — resolution
      glowColor: "#52C97C",
      highlightBounds: [
        [-79, -20],
        [-44, 4],
      ],
      regions: [
        {
          coordinates: [
            [-79, 3], [-74, 5], [-68, 5], [-62, 4], [-56, 2],
            [-50, -1], [-46, -5], [-48, -9], [-52, -13],
            [-58, -16], [-65, -17], [-72, -15], [-78, -11],
            [-81, -5], [-79, 3],
          ],
        },
      ],
      pattern: { angle: 0, spacing: 6, lineWidth: 0.7 }, // returns to calm horizontal — resolution
    },
    stats: [
      { label: "Additional regional wealth generated (modeled)", value: "US$339.3B" },
      { label: "Public investment return (modeled)", value: "US$29.5B" },
      // Not in the verified claims list — this is 339.3 ÷ 29.5, computed
      // here rather than sourced. Labeled "(derived)" so it isn't mistaken
      // for a verified figure alongside the two above it.
      { label: "Benefit-to-cost ratio (derived)", value: "~11.5×" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helper — color palette for the summary section
// ---------------------------------------------------------------------------

/** Quick lookup: ecosystem id → accent color */
export const ecosystemColors: Record<string, string> = Object.fromEntries(
  ecosystems.map((e) => [e.id, e.globe.color]),
);
