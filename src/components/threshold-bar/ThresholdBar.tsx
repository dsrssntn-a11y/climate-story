/**
 * ThresholdBar.tsx — Animated range bar showing how close an ecosystem
 * is to its tipping point.
 *
 * DESIGN INSPIRATION:
 * The NYT tipping-points article uses a horizontal temperature bar with
 * an "imprecise scribble" showing the uncertainty range where a tipping
 * point might be triggered. We replicate this with:
 *
 *   1. A dark track (the full 0–100% range)
 *   2. A filled portion (current observed value) that animates in
 *   3. A "danger zone" region with a sketchy/rough border showing the
 *      estimated tipping-point range
 *   4. Subtle tick marks and labels
 *
 * PURE TAILWIND:
 * All styling uses Tailwind classes. The only inline styles are for
 * dynamic widths/positions that depend on data values (which Tailwind
 * can't do statically).
 *
 * QWIK NOTES:
 * - `useVisibleTask$` triggers the entrance animation when the
 *   component scrolls into view.
 * - `useSignal` tracks the animated width for smooth entrance.
 */

import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ThresholdBarProps {
  /** Label shown above the bar */
  label: string;
  /** Current value (0–100) */
  currentValue: number;
  /** Tipping point uncertainty range [low, high] (0–100) */
  tippingRange: [number, number];
  /** Unit label, e.g. "% lost" */
  unit: string;
  /** Accent color (hex) */
  color: string;
  /** Whether the component is in view (triggers animation) */
  isVisible?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ThresholdBar = component$<ThresholdBarProps>((props) => {
  // Animated width starts at 0 and grows to currentValue
  const animatedWidth = useSignal(0);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const visible = track(() => props.isVisible);
    if (!visible) return;

    // Animate the fill bar from 0 to currentValue over 1.2s
    const start = performance.now();
    const duration = 1200;

    function animate(now: number) {
      const t = Math.min((now - start) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      animatedWidth.value = eased * props.currentValue;
      if (t < 1) requestAnimationFrame(animate);
    }

    // Small delay so it starts after the globe animation
    setTimeout(() => requestAnimationFrame(animate), 400);
  });

  const [tippingLow, tippingHigh] = props.tippingRange;

  return (
    <div class="w-full max-w-xl mx-auto px-4">
      {/* ── Label ─────────────────────────────────────────────────── */}
      <div class="flex justify-between items-baseline mb-2">
        <span class="text-sm text-slate-100 font-medium tracking-wide uppercase">
          {props.label}
        </span>
        <span class="text-sm font-mono text-slate-300">
          {Math.round(animatedWidth.value)}
          {props.unit}
        </span>
      </div>

      {/* ── Bar track ─────────────────────────────────────────────── */}
      <div class="relative mt-6">
        {/* Tipping zone label — positioned above the bar */}
        <div
          class="absolute -top-5 text-xs text-red-400 font-medium whitespace-nowrap"
          style={{
            left: `${(tippingLow + tippingHigh) / 2}%`,
            transform: "translateX(-50%)",
          }}
        >
          Tipping range
        </div>

        <div class="relative h-8 bg-slate-800/60 rounded-full overflow-hidden border border-slate-700/50">
          {/* Filled portion (current value) */}
          <div
            class="absolute inset-y-0 left-0 rounded-full transition-none"
            style={{
              width: `${animatedWidth.value}%`,
              backgroundColor: props.color,
              opacity: 0.7,
            }}
          />

          {/* ── Tipping-point danger zone ────────────────────────────
               The "imprecise scribble" from the NYT design — we render
               it as a hatched/dashed region with a rough border. */}
          <div
            class="absolute inset-y-0 border-l-2 border-r-2 border-dashed"
            style={{
              left: `${tippingLow}%`,
              width: `${tippingHigh - tippingLow}%`,
              borderColor: "#ef4444", // red-500
              backgroundColor: "rgba(239, 68, 68, 0.1)",
            }}
          >
            {/* Inner hatching for the "sketchy" effect */}
            <div
              class="w-full h-full opacity-20"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(239,68,68,0.3) 3px, rgba(239,68,68,0.3) 4px)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Tick marks ────────────────────────────────────────────── */}
      <div class="relative h-4 mt-1">
        {[0, 25, 50, 75, 100].map((tick) => (
          <span
            key={tick}
            class="absolute text-[10px] text-slate-200 font-mono"
            style={{
              left: `${tick}%`,
              transform: "translateX(-50%)",
            }}
          >
            {tick}
          </span>
        ))}
      </div>
    </div>
  );
});
