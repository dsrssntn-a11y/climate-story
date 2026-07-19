/**
 * ScrollSection.tsx — Scroll-triggered section wrapper for the
 * scrollytelling experience.
 *
 * HOW SCROLLYTELLING WORKS:
 * Each ecosystem section is wrapped in this component. It uses the
 * browser's Intersection Observer API to detect when the section
 * enters the viewport. When visible, it:
 *   1. Sets `isVisible` to true (passed down to Globe & ThresholdBar)
 *   2. Triggers CSS fade-in / slide-up animations via Tailwind classes
 *
 * WHY INTERSECTION OBSERVER?
 * - It's a native browser API — zero dependencies
 * - It's performant (runs off the main thread)
 * - It's the industry standard for scroll-triggered content
 *
 * QWIK NOTES:
 * - `useVisibleTask$` sets up the observer only in the browser.
 * - The observer is cleaned up automatically via the `cleanup` callback.
 * - We use `useSignal` for the visibility state to trigger re-renders.
 */

import {
  component$,
  Slot,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ScrollSectionProps {
  /** Unique ID for scroll anchoring (e.g. "coral-reefs") */
  id: string;
  /** Accent color for the left border glow */
  color: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ScrollSection = component$<ScrollSectionProps>((props) => {
  const sectionRef = useSignal<HTMLElement>();
  const isVisible = useSignal(false);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const el = sectionRef.value;
    if (!el) return;

    // Trigger when 15% of the section is visible
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
    <section
      ref={sectionRef}
      id={props.id}
      class={[
        // Layout
        "relative min-h-screen py-24 px-6 md:px-12 lg:px-24",
        // Fade-in animation driven by isVisible state
        "transition-all duration-1000 ease-out",
        isVisible.value
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-12",
      ]}
    >
      {/* Left accent border — a subtle glowing line */}
      <div
        class="absolute left-0 top-24 bottom-24 w-[2px] opacity-30 hidden lg:block"
        style={{
          background: `linear-gradient(to bottom, transparent, ${props.color}, transparent)`,
          boxShadow: `0 0 15px ${props.color}`,
        }}
      />

      {/* Content area — passed through via <Slot /> */}
      <div class="max-w-4xl mx-auto">
        <Slot />
      </div>

      {/* Bottom divider — fading line between sections */}
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
    </section>
  );
});
