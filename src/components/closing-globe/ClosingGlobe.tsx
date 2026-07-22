/**
 * ClosingGlobe.tsx — Dot-matrix orthographic globe for the closing section.
 *
 * A full-bleed background visual sitting behind "The Window Is Closing"
 * text. Land is stippled (sampled from the same real TopoJSON coastlines
 * every other globe in this piece uses) rather than filled, so it reads as
 * data rather than illustration. Five tipping points sonar-pulse; three
 * connection arcs — matching the three causal links the closing paragraph
 * actually names (Arctic → coral, Amazon → wetlands, grasslands → Arctic),
 * not an arbitrary all-pairs mesh — carry drifting particles between them.
 *
 * Continuously auto-rotates, like the Hero's OverviewGlobe. Unlike the
 * per-ecosystem Globe component, this one never settles — the render loop
 * runs for as long as the component is mounted, which is also what lets the
 * sonar pulses and drifting particles animate purely on canvas (no CSS
 * overlay needed, since there's no "stop after entrance" constraint here).
 * Non-interactive (no drag) since it sits behind readable text.
 */

import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import {
  geoOrthographic,
  geoPath,
  geoGraticule10,
  geoContains,
  geoDistance,
  geoInterpolate,
} from "d3-geo";
import * as topojson from "topojson-client";
import type { Topology } from "topojson-specification";

interface TippingPoint {
  name: string;
  position: [number, number];
  color: string;
}

// Illustrative real-world locations for the original five "Vanishing Earth"
// tipping points — this piece's own content is Amazon-only, so these are a
// closing "bigger picture" callback rather than data tied to specific claims.
const TIPPING_POINTS: TippingPoint[] = [
  { name: "Coral Reefs", position: [147, -18], color: "#38BDF8" },
  { name: "Amazon Rainforest", position: [-60, -5], color: "#34D399" },
  { name: "Arctic Sea Ice", position: [-45, 78], color: "#A5B4FC" },
  { name: "Mangroves & Coastal Wetlands", position: [89, 22], color: "#F59E0B" },
  { name: "Grasslands & Savannas", position: [35, -3], color: "#F87171" },
];

// The three causal links named in the closing paragraph, plus one bridging
// arc (Mangroves–Grasslands) so all five points sit on a single connected
// chain — Amazon–Mangroves–Grasslands–Arctic–Coral — rather than two
// separate groups that never touch.
const CONNECTIONS: [number, number][] = [
  [2, 0], // "Arctic ice loss warms the ocean, which bleaches coral"
  [1, 3], // "Amazon dieback reduces rainfall, which dries wetlands"
  [4, 2], // "Grassland conversion releases carbon, which melts more ice"
  [3, 4], // bridge: coastal wetlands and grasslands, closing the chain
];

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const ClosingGlobe = component$(() => {
  const canvasRef = useSignal<HTMLCanvasElement>();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const size = 900;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const projection = geoOrthographic()
      .translate([size / 2, size / 2])
      .scale(size / 2.15)
      .clipAngle(90)
      .rotate([30, -15]);

    const path = geoPath(projection, ctx);
    const graticule = geoGraticule10();

    function isFrontFacing(point: [number, number], rotation: [number, number]): boolean {
      const visibleCenter: [number, number] = [-rotation[0], -rotation[1]];
      return geoDistance(point, visibleCenter) < Math.PI / 2;
    }

    let currentLon = 30;
    const currentLat = -15;
    let frameId = 0;

    cleanup(() => cancelAnimationFrame(frameId));

    fetch("/data/world-110m.json")
      .then((res) => res.json())
      .then((world: Topology) => {
        const land = topojson.feature(world, world.objects.land as any) as any;

        // Dot-matrix — sampled once from real land geometry, not redone
        // every frame. Longitude step widens near the poles (meridians
        // converge there) to keep dot density visually even.
        const landDots: [number, number][] = [];
        const latStep = 2.4;
        for (let lat = -84; lat <= 84; lat += latStep) {
          const lonStep = latStep / Math.max(0.12, Math.cos((lat * Math.PI) / 180));
          for (let lon = -180; lon < 180; lon += lonStep) {
            if (geoContains(land, [lon, lat])) landDots.push([lon, lat]);
          }
        }

        function draw() {
          if (!ctx) return;
          currentLon += 0.08;
          const rotation: [number, number] = [currentLon, currentLat];
          projection.rotate(rotation);

          ctx.clearRect(0, 0, size, size);

          // Sphere + glow outline
          ctx.beginPath();
          path({ type: "Sphere" });
          ctx.fillStyle = "rgba(15, 23, 42, 0.55)";
          ctx.fill();
          ctx.beginPath();
          path({ type: "Sphere" });
          ctx.strokeStyle = "rgba(94, 234, 212, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Graticule
          ctx.beginPath();
          path(graticule);
          ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // Dot-matrix land
          ctx.fillStyle = "rgba(226, 232, 240, 0.55)";
          for (const dot of landDots) {
            if (!isFrontFacing(dot, rotation)) continue;
            const p = projection(dot);
            if (!p) continue;
            ctx.beginPath();
            ctx.arc(p[0], p[1], 1.1, 0, Math.PI * 2);
            ctx.fill();
          }

          // Connection arcs + one drifting particle each
          const particleT = (performance.now() % 4000) / 4000;
          for (const [aIdx, bIdx] of CONNECTIONS) {
            const interpolate = geoInterpolate(
              TIPPING_POINTS[aIdx].position,
              TIPPING_POINTS[bIdx].position,
            );

            ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 3]);
            ctx.beginPath();
            let penDown = false;
            for (let s = 0; s <= 1; s += 0.02) {
              const pt = interpolate(s);
              if (!isFrontFacing(pt, rotation)) {
                penDown = false;
                continue;
              }
              const proj = projection(pt)!;
              if (!penDown) {
                ctx.moveTo(proj[0], proj[1]);
                penDown = true;
              } else {
                ctx.lineTo(proj[0], proj[1]);
              }
            }
            ctx.stroke();
            ctx.setLineDash([]);

            const particlePos = interpolate(particleT);
            if (isFrontFacing(particlePos, rotation)) {
              const pp = projection(particlePos)!;
              ctx.fillStyle = "rgba(226, 232, 240, 0.9)";
              ctx.beginPath();
              ctx.arc(pp[0], pp[1], 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // Tipping-point markers — sonar pulse rings + solid core. Only the
          // point nearest the visible center gets its label drawn, fading
          // with distance — as the globe rotates, the label cycles through
          // all five ecosystems rather than cluttering the view with all of
          // them at once.
          const visibleCenter: [number, number] = [-rotation[0], -rotation[1]];
          let nearestIdx = -1;
          let nearestDist = Infinity;
          TIPPING_POINTS.forEach((tp, i) => {
            const d = geoDistance(tp.position, visibleCenter);
            if (d < nearestDist) {
              nearestDist = d;
              nearestIdx = i;
            }
          });

          TIPPING_POINTS.forEach((tp, i) => {
            if (!isFrontFacing(tp.position, rotation)) return;
            const p = projection(tp.position)!;

            const pulseMs = 3000;
            for (let ring = 0; ring < 2; ring++) {
              const phase = ((performance.now() + ring * (pulseMs / 2)) % pulseMs) / pulseMs;
              ctx.strokeStyle = hexToRgba(tp.color, 0.55 * (1 - phase));
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(p[0], p[1], 5 + phase * 24, 0, Math.PI * 2);
              ctx.stroke();
            }

            ctx.fillStyle = tp.color;
            ctx.beginPath();
            ctx.arc(p[0], p[1], 4, 0, Math.PI * 2);
            ctx.fill();

            if (i === nearestIdx) {
              const alpha = Math.max(0, 1 - nearestDist / (Math.PI / 3));
              if (alpha > 0.05) {
                ctx.font = "600 15px system-ui, -apple-system, sans-serif";
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.textAlign = "left";
                ctx.textBaseline = "middle";
                ctx.fillText(tp.name, p[0] + 12, p[1]);
              }
            }
          });

          frameId = requestAnimationFrame(draw);
        }

        frameId = requestAnimationFrame(draw);
      })
      .catch((err) => {
        console.error("ClosingGlobe failed to load world data:", err);
      });
  });

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={900}
      class="w-full h-full"
      aria-hidden="true"
    />
  );
});
