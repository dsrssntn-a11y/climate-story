import { component$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";

interface FlyingBird {
  src: string;
  path: string;
  delayMs: number;
  durationMs: number;
  size: number;
  flip?: boolean;
}

const flyingBirds: FlyingBird[] = [
  {
    src: "/birds/eagle-flying.svg",
    path: "path('M -60,260 C 180,140 480,280 760,120')",
    delayMs: 500,
    durationMs: 10000, // slow, unhurried glide across the globe
    size: 56,
  },
];

export const BirdLayer = component$(({ isVisible }: { isVisible: Signal<boolean> }) => {
  return (
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      {flyingBirds.map((bird, i) => (
        <img
          key={`fly-${i}`}
          src={bird.src}
          width={bird.size}
          height={bird.size}
          class={["absolute top-0 left-0", isVisible.value ? "bird-fly" : "opacity-0"]}
          style={{
            offsetPath: bird.path,
            offsetRotate: "auto",
            animationDelay: `${bird.delayMs}ms`,
            animationDuration: `${bird.durationMs}ms`,
            transform: bird.flip ? "scaleX(-1)" : undefined,
          }}
        />
      ))}
    </div>
  );
});
