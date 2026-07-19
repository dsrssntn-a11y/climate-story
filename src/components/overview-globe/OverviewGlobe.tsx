/**
 * OverviewGlobe.tsx — Large hero globe showing ALL ecosystem tipping points
 * at once, with labels and color-coded hatched regions.
 *
 * DESIGN INSPIRATION:
 * The NYT article opens with a single large globe that shows every tipping
 * point labeled on it — permafrost, Greenland ice, coral, rainforest,
 * monsoon, currents — all visible at once with distinct hatching patterns.
 *
 * We replicate this with a slowly auto-rotating globe that displays all
 * five ecosystem regions simultaneously, each rendered with a unique
 * hatching style and a floating label.
 *
 * IMPLEMENTATION:
 * - Uses a larger canvas (600px) for visual impact
 * - Slowly auto-rotates; pauses on drag, resumes after release
 * - Each ecosystem gets hatched region polygons + label
 * - Labels are drawn on the canvas (not DOM) to move with the globe
 */

import {
  component$,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import * as d3 from "d3";
import { geoOrthographic, geoPath, geoGraticule10, geoArea } from "d3-geo";
import * as topojson from "topojson-client";
import type { Topology } from "topojson-specification";
import { ecosystems } from "~/data/ecosystems";
import type { PatternConfig } from "~/data/ecosystems";

// ---------------------------------------------------------------------------
// Hatched region drawing (shared logic with Globe.tsx)
// ---------------------------------------------------------------------------

function drawHatchedRegion(
  ctx: CanvasRenderingContext2D,
  pathFn: d3.GeoPath<any, any>,
  ring: [number, number][],
  color: string,
  pattern: PatternConfig,
  size: number,
  opacity: number,
) {
  let coords = ring;
  const feature = {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [coords],
    },
    properties: {},
  };

  // Auto-correct winding: GeoJSON requires CCW exterior rings.
  if (geoArea(feature as any) > 2 * Math.PI) {
    coords = ring.slice().reverse();
    feature.geometry.coordinates = [coords];
  }

  ctx.save();
  ctx.beginPath();
  pathFn(feature as any);
  ctx.clip();

  const rad = (pattern.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const diagonal = size * 1.5;

  ctx.strokeStyle = color;
  ctx.lineWidth = pattern.lineWidth;
  ctx.globalAlpha = opacity;

  const cx = size / 2;
  const cy = size / 2;

  for (let d = -diagonal; d <= diagonal; d += pattern.spacing) {
    const px = cx + d * cos;
    const py = cy + d * sin;

    ctx.beginPath();
    ctx.moveTo(px - diagonal * sin, py + diagonal * cos);
    ctx.lineTo(px + diagonal * sin, py - diagonal * cos);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const OverviewGlobe = component$(() => {
  const canvasRef = useSignal<HTMLCanvasElement>();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {

    const canvas = canvasRef.value;
    if (!canvas) return;

    const size = 600;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // ── Projection ──────────────────────────────────────────────
    const projection = geoOrthographic()
      .translate([size / 2, size / 2])
      .scale(size / 2.2)
      .clipAngle(90)
      .rotate([-20, -20]); // Start showing Atlantic/Africa view

    const path = geoPath(projection, ctx);
    const graticule = geoGraticule10();

    // ── Drag interaction state ────────────────────────────────────
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartRotation: [number, number] = [-20, -20];
    let currentLon = -20;
    let currentLat = -20;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    let autoRotate = true;

    const sensitivity = 0.4;

    function getCanvasPos(e: MouseEvent | Touch): [number, number] {
      const rect = canvas!.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    }

    function onDragStart(x: number, y: number) {
      isDragging = true;
      autoRotate = false;
      if (resumeTimer) clearTimeout(resumeTimer);
      dragStartX = x;
      dragStartY = y;
      dragStartRotation = [currentLon, currentLat];
      canvas!.style.cursor = "grabbing";
    }

    function onDragMove(x: number, y: number) {
      if (!isDragging) return;
      const dx = x - dragStartX;
      const dy = y - dragStartY;
      currentLon = dragStartRotation[0] + dx * sensitivity;
      currentLat = Math.max(-90, Math.min(90, dragStartRotation[1] - dy * sensitivity));
      projection.rotate([currentLon, currentLat]);
    }

    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      canvas!.style.cursor = "grab";
      // Resume auto-rotation after 2 seconds of inactivity
      resumeTimer = setTimeout(() => {
        autoRotate = true;
      }, 2000);
    }

    // Mouse events
    const onMouseDown = (e: MouseEvent) => {
      const [x, y] = getCanvasPos(e);
      onDragStart(x, y);
    };
    const onMouseMove = (e: MouseEvent) => {
      const [x, y] = getCanvasPos(e);
      onDragMove(x, y);
    };
    const onMouseUp = () => onDragEnd();

    // Touch events
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const [x, y] = getCanvasPos(e.touches[0]);
      onDragStart(x, y);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      const [x, y] = getCanvasPos(e.touches[0]);
      onDragMove(x, y);
    };
    const onTouchEnd = () => onDragEnd();

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.style.cursor = "grab";

    cleanup(() => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      if (resumeTimer) clearTimeout(resumeTimer);
    });

    // ── Load world data ─────────────────────────────────────────
    fetch("/data/world-110m.json")
      .then((res) => res.json())
      .then((world: Topology) => {
        const land = topojson.feature(
          world,
          world.objects.land as any,
        ) as any;
        const countries = topojson.feature(
          world,
          world.objects.countries as any,
        ) as any;

        // ── Auto-rotation speed ─────────────────────────────────
        const rotationSpeed = 0.08;

        function draw() {
          if (!ctx) return;

          // Auto-rotate only when not dragging
          if (autoRotate && !isDragging) {
            currentLon += rotationSpeed;
          }
          projection.rotate([currentLon, currentLat]);

          ctx.clearRect(0, 0, size, size);

          // 1. Globe sphere
          ctx.beginPath();
          path({ type: "Sphere" });
          ctx.fillStyle = "rgba(15, 23, 42, 0.5)";
          ctx.fill();

          // 2. Subtle sphere outline
          ctx.beginPath();
          path({ type: "Sphere" });
          ctx.strokeStyle = "rgba(100, 116, 139, 0.3)";
          ctx.lineWidth = 1;
          ctx.stroke();

          // 3. Graticule
          ctx.beginPath();
          path(graticule);
          ctx.strokeStyle = "rgba(148, 163, 184, 0.06)";
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // 4. Land
          ctx.beginPath();
          path(land);
          ctx.fillStyle = "rgba(148, 163, 184, 0.12)";
          ctx.fill();

          ctx.beginPath();
          path(countries);
          ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
          ctx.lineWidth = 0.3;
          ctx.stroke();

          // 5. Ecosystem hotspots — hatched regions + labels
          for (const eco of ecosystems) {
            const centerProj = projection(eco.globe.center);

            // Hatched region polygons
            // Use slightly wider spacing on the overview globe for clarity
            const overviewPattern = {
              ...eco.globe.pattern,
              spacing: eco.globe.pattern.spacing + 2,
            };
            for (const region of eco.globe.regions) {
              drawHatchedRegion(
                ctx,
                path,
                region.coordinates,
                eco.globe.color,
                overviewPattern,
                size,
                0.55, // slightly lower opacity for the overview
              );
            }

            // Label at ecosystem center
            if (centerProj) {
              const dist = d3.geoDistance(
                eco.globe.center,
                [-(currentLon), -currentLat],
              );
              if (dist < Math.PI / 2.5) {
                const alpha = Math.max(0, 1 - dist / (Math.PI / 2.5));
                ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
                ctx.fillStyle = eco.globe.color;
                ctx.globalAlpha = alpha * 0.9;
                ctx.textAlign = "center";

                const label = eco.name.toUpperCase();
                ctx.fillText(label, centerProj[0], centerProj[1] - 14);

                ctx.globalAlpha = 1;
              }
            }
          }

          requestAnimationFrame(draw);
        }

        requestAnimationFrame(draw);
      });
  }, { strategy: 'document-ready' });

  return (
    <section class="relative flex flex-col items-center justify-center py-6 px-4">
      {/* ── Globe ───────────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        class="w-full max-w-[480px] h-auto touch-none"
        aria-label="Overview globe showing all five ecosystem tipping points — drag to rotate"
        role="img"
      />

      {/* ── Legend below the globe ───────────────────────────────── */}
      <div class="flex flex-wrap justify-center gap-y-3 gap-x-6 mt-8 max-w-lg">
        {ecosystems.map((eco) => (
          <a
            key={eco.id}
            href={`#${eco.id}`}
            class="flex items-center gap-2 group"
          >
            <div
              class="w-2.5 h-2.5 rounded-full group-hover:scale-125 transition-transform flex-shrink-0"
              style={{
                backgroundColor: eco.globe.color,
                boxShadow: `0 0 8px ${eco.globe.color}`,
              }}
            />
            <span class="text-sm text-slate-100 group-hover:text-slate-200 transition-colors whitespace-nowrap">
              {eco.name}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
});
