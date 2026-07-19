import { component$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";

export const GrowthHighlight = component$(({ isVisible }: { isVisible: Signal<boolean> }) => {
  return (
    <div
      class="absolute pointer-events-none transition-all duration-700 ease-out"
      style={{
        top: "38%",
        left: "58%",
        opacity: isVisible.value ? 1 : 0,
        transform: `scale(${isVisible.value ? 1 : 0.6})`,
        transitionDelay: "900ms",
      }}
    >
      <div class="growth-pulse rounded-full flex items-center justify-center">
        <img
          src="/icons/dollar-uptrend.svg"
          width={64}
          height={64}
        />
      </div>
    </div>
  );
});
