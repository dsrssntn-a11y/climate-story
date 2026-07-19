/**
 * Globe.tsx — D3 orthographic projection rendered on an HTML Canvas.
 *
 * HOW IT WORKS:
 * 1. We use D3's orthographic projection to render a 3D-looking globe.
 * 2. The globe rotates to center on the ecosystem's coordinates.
 * 3. Geographic region polygons are drawn with hatched line patterns
 *    (like the NYT climate tipping-points article).
 * 4. Land masses are drawn with subtle outlines on a dark background.
 * 5. A graticule (grid lines) adds depth and a "scientific" feel.
 *
 * WHY CANVAS (not SVG)?
 * Canvas is faster for the kind of full-redraw rendering we do here.
 * Globe rotation animations are smoother on Canvas. SVG would create
 * hundreds of DOM nodes for country paths, which is expensive.
 *
 * QWIK NOTES:
 * - `useVisibleTask$` runs only in the browser (never on the server).
 *   This is critical because D3 needs access to the DOM/Canvas API.
 * - `useSignal` gives us a reactive ref to the <canvas> element.
 */

import {
  component$,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import { geoOrthographic, geoPath, geoGraticule10, geoArea } from "d3-geo";
import * as topojson from "topojson-client";
import type { Topology } from "topojson-specification";
import type { EcosystemRegion, PatternConfig } from "~/data/ecosystems";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GlobeProps {
  /** [longitude, latitude] — where to center the globe */
  center: [number, number];
  /** Hex color for the highlighted region */
  color: string;
  /** Hex color for the glow effect */
  glowColor: string;
  /** Bounding box kept for radial glow positioning */
  highlightBounds: [[number, number], [number, number]];
  /** Geographic region polygons for hatched rendering */
  regions: EcosystemRegion[];
  /** Hatching pattern config */
  pattern: PatternConfig;
  /** Whether the globe is currently visible (triggers entrance animation) */
  isVisible?: boolean;
}

// ---------------------------------------------------------------------------
// Hatched region drawing utility
// ---------------------------------------------------------------------------

/**
 * Draw NYT-style hatched lines inside a geographic polygon.
 *
 * How it works:
 * 1. Use D3's geoPath to project the polygon onto the canvas (this handles
 *    the orthographic projection + hemisphere clipping automatically).
 * 2. Clip the canvas to that projected shape.
 * 3. Draw parallel lines at the specified angle across the clipped area.
 * 4. The clip ensures lines only appear inside the geographic region.
 */
function drawHatchedRegion(
  ctx: CanvasRenderingContext2D,
  pathFn: d3.GeoPath<any, any>,
  ring: [number, number][],
  color: string,
  pattern: PatternConfig,
  size: number,
  opacity: number,
) {
  // Build a GeoJSON Feature from the coordinate ring
  let coords = ring;
  const feature = {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [coords],
    },
    properties: {},
  };

  // Auto-correct winding order: GeoJSON requires CCW exterior rings.
  // If geoArea > 2π steradians (half the globe), the ring is CW — reverse it.
  if (geoArea(feature as any) > 2 * Math.PI) {
    coords = ring.slice().reverse();
    feature.geometry.coordinates = [coords];
  }

  ctx.save();

  // Project polygon and use it as a clip mask
  ctx.beginPath();
  pathFn(feature as any);
  ctx.clip();

  // Draw parallel hatch lines covering the full canvas, clipped to the polygon
  const rad = (pattern.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const diagonal = size * 1.5; // long enough to cover any rotation

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

export const Globe = component$<GlobeProps>((props) => {
  const canvasRef = useSignal<HTMLCanvasElement>();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    // Re-run when visibility changes (triggers entrance animation)
    track(() => props.isVisible);

    const canvas = canvasRef.value;
    if (!canvas) return;

    const size = 480; // logical pixel size (CSS scales it responsively)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // ── Projection setup ──────────────────────────────────────────────
    const projection = geoOrthographic()
      .translate([size / 2, size / 2])
      .scale(size / 2.2)
      .clipAngle(90); // only show the front hemisphere

    const path = geoPath(projection, ctx);
    const graticule = geoGraticule10();

    // ── Drag interaction state ────────────────────────────────────────
    let currentRotation: [number, number] = [0, -20];
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartRotation: [number, number] = [0, -20];
    let animationDone = false;
    let frameId = 0;

    // Scale factor: how many degrees per pixel of drag
    const sensitivity = 0.4;

    /** Convert mouse/touch event to canvas-relative coords */
    function getCanvasPos(e: MouseEvent | Touch): [number, number] {
      const rect = canvas!.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    }

    function onDragStart(x: number, y: number) {
      if (!animationDone) return;
      isDragging = true;
      dragStartX = x;
      dragStartY = y;
      dragStartRotation = [...currentRotation] as [number, number];
      canvas!.style.cursor = "grabbing";
    }

    function onDragMove(x: number, y: number) {
      if (!isDragging) return;
      const dx = x - dragStartX;
      const dy = y - dragStartY;
      currentRotation = [
        dragStartRotation[0] + dx * sensitivity,
        Math.max(-90, Math.min(90, dragStartRotation[1] - dy * sensitivity)),
      ];
      projection.rotate(currentRotation);
      renderFrame();
    }

    function onDragEnd() {
      isDragging = false;
      canvas!.style.cursor = "grab";
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
      e.preventDefault(); // prevent page scroll while rotating
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

    cleanup(() => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      cancelAnimationFrame(frameId);
    });

    // ── Load world topology data ──────────────────────────────────────
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

        // ── Render a single frame (used by both animation & drag) ──
        function renderFrameInner() {
          if (!ctx) return;

          // Clear canvas
          ctx.clearRect(0, 0, size, size);

          // ── 1. Globe background (dark sphere) ───────────────────
          ctx.beginPath();
          path({ type: "Sphere" });
          ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
          ctx.fill();

          // ── 2. Subtle sphere outline ─────────────────────────────
          ctx.beginPath();
          path({ type: "Sphere" });
          ctx.strokeStyle = props.glowColor;
          ctx.lineWidth = 1;
          ctx.stroke();

          // ── 3. Graticule (grid lines for depth) ─────────────────
          ctx.beginPath();
          path(graticule);
          ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // ── 4. Land masses ──────────────────────────────────────
          ctx.beginPath();
          path(land);
          ctx.fillStyle = "rgba(148, 163, 184, 0.15)";
          ctx.fill();

          ctx.beginPath();
          path(countries);
          ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // ── 5. Hatched region polygons ──────────────────────────
          // Each region is a geographic polygon rendered with parallel
          // lines clipped to its projected shape on the globe.
          for (const region of props.regions) {
            drawHatchedRegion(
              ctx,
              path,
              region.coordinates,
              props.color,
              props.pattern,
              size,
              0.7, // opacity
            );
          }

          // ── 6. Thin border around each region for definition ────
          for (const region of props.regions) {
            const feature = {
              type: "Feature" as const,
              geometry: {
                type: "Polygon" as const,
                coordinates: [region.coordinates],
              },
              properties: {},
            };
            ctx.beginPath();
            path(feature as any);
            ctx.strokeStyle = props.color + "50";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Expose renderFrame to outer scope for drag handler
        renderFrame = renderFrameInner;

        // ── Animation: rotate globe to target center ────────────────
        const startRotation: [number, number] = [0, -20];
        const endRotation: [number, number] = [
          -props.center[0],
          -props.center[1],
        ];
        const duration = props.isVisible ? 1200 : 0;
        const startTime = performance.now();

        function draw(currentTime: number) {
          if (!ctx || isDragging) return;

          const elapsed = currentTime - startTime;
          const t = Math.min(elapsed / Math.max(duration, 1), 1);
          const eased = 1 - Math.pow(1 - t, 3);

          currentRotation = [
            startRotation[0] +
              (endRotation[0] - startRotation[0]) * eased,
            startRotation[1] +
              (endRotation[1] - startRotation[1]) * eased,
          ];
          projection.rotate(currentRotation);

          renderFrameInner();

          if (t < 1) {
            frameId = requestAnimationFrame(draw);
          } else {
            animationDone = true;
            canvas!.style.cursor = "grab";
          }
        }

        frameId = requestAnimationFrame(draw);
      });

    // Placeholder — gets replaced once world data loads
    // eslint-disable-next-line prefer-const
    let renderFrame: () => void = () => {};
  });

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={480}
      class="mx-auto w-full max-w-[480px] h-auto touch-none"
      aria-label="Interactive globe showing ecosystem location — drag to rotate"
      role="img"
    />
  );
});
