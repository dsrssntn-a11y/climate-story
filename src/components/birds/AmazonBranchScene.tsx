import { component$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";

export const AmazonBranchScene = component$(({ isVisible }: { isVisible: Signal<boolean> }) => {
  return (
    <div
      class="pointer-events-none mx-auto transition-all duration-1000 ease-out"
      style={{
        width: "200px",
        opacity: isVisible.value ? 1 : 0,
        transform: `translateY(${isVisible.value ? "0" : "16px"}) scale(${isVisible.value ? 1 : 0.85})`,
        transitionDelay: "1200ms",
      }}
    >
      <img
        src="/birds/amazon-branch-scene-color-v3.svg"
        width={200}
        class="branch-sway mx-auto"
        style={{ transformOrigin: "6% 88%" }}
      />
    </div>
  );
});
