import { component$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";

export const GhostDrift = component$(({ isVisible }: { isVisible: Signal<boolean> }) => {
  return (
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <img
        src="/icons/halloween-ghost.svg"
        width={44}
        height={44}
        class={["absolute top-0 left-0", isVisible.value ? "ghost-drift" : "opacity-0"]}
        style={{
          offsetPath: "path('M -60,200 C 100,120 200,260 340,180 C 480,100 600,240 760,160')",
          animationDelay: "600ms",
        }}
      />
    </div>
  );
});
