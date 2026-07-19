import { component$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";

export const TemperatureMarker = component$(({ isVisible }: { isVisible: Signal<boolean> }) => {
  return (
    <div
      class="absolute pointer-events-none transition-all duration-700 ease-out"
      style={{
        top: "44.4%",
        left: "46%",
        opacity: isVisible.value ? 1 : 0,
        transform: `scale(${isVisible.value ? 1 : 0.6})`,
        transitionDelay: "1100ms",
      }}
    >
      <div class="relative flex items-center justify-center" style={{ width: "44px", height: "44px" }}>
        <span class="temp-ping absolute inset-0 rounded-full" />
        <img
          src="/icons/temperature.svg"
          width={36}
          height={36}
          class="relative temp-bob"
        />
      </div>
    </div>
  );
});
