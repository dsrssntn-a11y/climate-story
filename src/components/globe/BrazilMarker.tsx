import { component$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";

export const BrazilMarker = component$(({ isVisible }: { isVisible: Signal<boolean> }) => {
  return (
    <div
      class="absolute pointer-events-none transition-all duration-700 ease-out"
      style={{
        top: "43%",
        left: "40%",
        opacity: isVisible.value ? 1 : 0,
        transform: `scale(${isVisible.value ? 1 : 0.6})`,
        transitionDelay: "1100ms",
      }}
    >
      <div class="relative flex items-center justify-center" style={{ width: "34px", height: "34px" }}>
        <span class="brazil-ping absolute inset-0 rounded-full" />
        <img
          src="/icons/price-label-red-teal.svg"
          width={28}
          height={28}
          class="relative brazil-bob"
        />
      </div>
    </div>
  );
});
