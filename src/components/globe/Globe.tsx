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
import { geoOrthographic, geoPath, geoGraticule10, geoArea, geoDistance, geoCentroid } from "d3-geo";
import * as topojson from "topojson-client";
import type { Topology } from "topojson-specification";
import type { EcosystemRegion, PatternConfig } from "~/data/ecosystems";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * The story's climax — a single large, dominant bubble at the shared
 * region's own center, wrapped in a bright pulsing halo. Deliberately the
 * biggest, boldest thing drawn on any globe in the piece: the payoff moment
 * gets payoff-sized visual weight. Same real-geometry, canvas-drawn, and
 * hemisphere-clipped foundation as everything else — no illustrated icon.
 */
interface GainBurst {
  position: [number, number];
  /** Crisp ring color (the region's base accent) */
  color: string;
  /** Bubble fill + halo color (the region's brighter glow accent) */
  glowColor: string;
}

/**
 * Highlights a whole country/continent using its real boundary — merged from
 * the same TopoJSON topology as the coastlines, not a hand-plotted polygon.
 * Rendered as a soft glow plus a crisp outline, both drawn from actual
 * geometry, so it's clipped to the visible hemisphere for free.
 */
interface ContinentHighlight {
  /** Names matching TopoJSON country `properties.name` values to merge */
  countryNames: string[];
}

/**
 * A flat dashed "sparkline" chip pinned to a real coordinate — a Bloomberg-
 * style ticker reading zero volatility, used to represent an assumption of
 * constancy. The dashed line + endpoints are drawn on canvas (so they stay
 * crisp and hemisphere-clipped like everything else); a small pulsing dot
 * at its midpoint is a DOM overlay, positioned the same way as `marker`.
 */
interface SparklineMarker {
  position: [number, number];
  /** Total width of the flat line, in canvas px */
  width: number;
  color: string;
}

/**
 * A dashed "limit line" drawn across the region, with a warning tick where
 * the hatched region genuinely rises above it. Its position is derived from
 * `highlightBounds` (20% down from the region's real northern edge) rather
 * than a hand-picked pixel offset, so the breach it shows is real.
 */
interface ThresholdLine {
  /** Line/whisker color (the region's base accent) */
  color: string;
  /** Warning-tick + glow color (the region's lighter glow accent) */
  tickColor: string;
}

/**
 * A hub-and-spoke power-grid diagram — real country coordinates connected to
 * a central hub, with each node flickering independently (staggered CSS
 * delay) to read as an unreliable shared grid rather than a synced pulse.
 * The hub sits at the globe's own `center`, so lines are drawn on canvas
 * (static, hemisphere-clipped); nodes are DOM dots for the CSS flicker.
 */
interface GridNetwork {
  nodes: { position: [number, number] }[];
  color: string;
}

/**
 * Proportional loss ripples — a solid dot per country (radius ∝ √value, so
 * area is proportional to the dollar figure) with an expanding, fading ring
 * looping around it. Each node's ring inherits that node's own size, so
 * a bigger loss naturally produces a bigger ripple with no per-node CSS.
 */
interface LossRipple {
  nodes: { position: [number, number]; value: number }[];
  color: string;
}

/** Circle radius scaled so *area* (not radius) is proportional to `value`. */
function bubbleRadius(value: number, maxValue: number): number {
  const minR = 4;
  const maxR = 15;
  return minR + Math.sqrt(value / maxValue) * (maxR - minR);
}

/**
 * Crossfades the region's hatch between its normal (calm-looking) pattern
 * and a sparser "reality" pattern — the canopy that appears intact from
 * above, breathing against the degraded state hidden underneath. Unlike
 * every other overlay in this file, this needs the render loop to keep
 * ticking indefinitely rather than settling after the entrance animation.
 */
interface CanopyFade {
  revealPattern: PatternConfig;
  /** Full canopy → reality → canopy cycle length, ms (default 7000) */
  cycleMs?: number;
}

interface GlobeProps {
  /** [longitude, latitude] — where to center the globe */
  center: [number, number];
  /** Hex color for the highlighted region */
  color: string;
  /** Hex color for the glow effect */
  glowColor: string;
  /** Bounding box: [[west, south], [east, north]] — also anchors thresholdLine */
  highlightBounds: [[number, number], [number, number]];
  /** Geographic region polygons for hatched rendering */
  regions: EcosystemRegion[];
  /** Hatching pattern config */
  pattern: PatternConfig;
  /** Whether the globe is currently visible (triggers entrance animation) */
  isVisible?: boolean;
  /** Optional whole-country/continent highlight, built from real borders */
  continentHighlight?: ContinentHighlight;
  /** Optional flatline sparkline chip rendered at a real geographic coordinate */
  sparkline?: SparklineMarker;
  /** Optional threshold breach line, anchored from highlightBounds */
  thresholdLine?: ThresholdLine;
  /** Optional hub-and-spoke grid network, hub at `center` */
  gridNetwork?: GridNetwork;
  /** Optional proportional loss ripples, radius ∝ √value per node */
  lossRipple?: LossRipple;
  /** Optional canopy/reality hatch crossfade over the region */
  canopyFade?: CanopyFade;
  /** Optional climactic gain-burst bubble, dominant size + halo */
  gainBurst?: GainBurst;
}

/** True when `point` is within the visible hemisphere for the given rotation. */
function isFrontFacing(point: [number, number], rotation: [number, number]): boolean {
  const visibleCenter: [number, number] = [-rotation[0], -rotation[1]];
  return geoDistance(point, visibleCenter) < Math.PI / 2;
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
  const markerRef = useSignal<HTMLDivElement>();
  const networkRef = useSignal<HTMLDivElement>();
  const rippleRef = useSignal<HTMLDivElement>();

  // Derived from props, needed both by the canvas render loop below and by
  // the ripple rings' JSX sizing — computed once here rather than twice.
  const lossRippleMaxValue = props.lossRipple
    ? Math.max(...props.lossRipple.nodes.map((n) => n.value))
    : 0;

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

    // Canvas's displayed CSS size can be smaller than `size` (responsive
    // scaling on narrow viewports) — track that ratio so the marker's pixel
    // position, computed against the logical projection, lands in the same
    // spot the canvas itself is actually drawn at.
    let displayScale = 1;
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) displayScale = entry.contentRect.width / size;
    });
    resizeObserver.observe(canvas);

    // ── Projection setup ──────────────────────────────────────────────
    const projection = geoOrthographic()
      .translate([size / 2, size / 2])
      .scale(size / 2.2)
      .clipAngle(90); // only show the front hemisphere

    const path = geoPath(projection, ctx);
    const graticule = geoGraticule10();

    // Threshold-line anchor — 20% down from the region's real northern edge,
    // longitude centered on the bounds. Doesn't depend on rotation, so it's
    // computed once rather than every frame.
    const thresholdAnchor: [number, number] | null = props.thresholdLine
      ? (() => {
          const [[west, south], [east, north]] = props.highlightBounds;
          return [(west + east) / 2, north - (north - south) * 0.2];
        })()
      : null;

    // Single shared anchor for whichever DOM overlay is active this section
    // (sparkline, threshold tick, or gain burst — sections use at most one).
    const overlayAnchor: [number, number] | null =
      props.sparkline?.position ?? thresholdAnchor ?? props.gainBurst?.position ?? null;

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
      resumeAutoLoop();
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
      resizeObserver.disconnect();
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

        // ── Continent highlight geometry (merged from real country borders) ──
        let continentShape: any = null;
        let continentCentroid: [number, number] | null = null;
        if (props.continentHighlight) {
          const matches = (world.objects.countries as any).geometries.filter(
            (g: any) => props.continentHighlight!.countryNames.includes(g.properties?.name),
          );
          if (matches.length) {
            continentShape = topojson.merge(world, matches) as any;
            continentCentroid = geoCentroid(continentShape);
          }
        }

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

          // ── 4b. Continent highlight — soft glow behind the real
          // coastline, so a whole country/continent reads as "in focus"
          // without recoloring the map. Radius is derived from the shape's
          // live projected bounds, so it foreshortens correctly as the
          // globe rotates the landmass toward the limb.
          if (continentShape && continentCentroid) {
            const centerPx = projection(continentCentroid);
            const bounds = path.bounds(continentShape);
            if (centerPx && bounds) {
              const [[x0, y0], [x1, y1]] = bounds;
              const radius = Math.max(x1 - x0, y1 - y0) * 0.75;

              ctx.save();
              ctx.beginPath();
              path({ type: "Sphere" });
              ctx.clip();

              const gradient = ctx.createRadialGradient(
                centerPx[0], centerPx[1], 0,
                centerPx[0], centerPx[1], radius,
              );
              gradient.addColorStop(0, props.glowColor + "40");
              gradient.addColorStop(0.6, props.glowColor + "14");
              gradient.addColorStop(1, props.glowColor + "00");
              ctx.fillStyle = gradient;
              ctx.beginPath();
              ctx.arc(centerPx[0], centerPx[1], radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }

          // ── 5. Hatched region polygons ──────────────────────────
          // Each region is a geographic polygon rendered with parallel
          // lines clipped to its projected shape on the globe. When
          // canopyFade is set, two patterns crossfade on the same polygon —
          // the calm pattern (canopy, "looks intact") and a sparser one
          // (the degraded reality hidden underneath) — rather than one
          // static pattern at fixed opacity.
          if (props.canopyFade) {
            const cycle = props.canopyFade.cycleMs ?? 7000;
            const phase = (performance.now() % cycle) / cycle;
            const reality = (Math.sin(phase * Math.PI * 2 - Math.PI / 2) + 1) / 2;

            for (const region of props.regions) {
              drawHatchedRegion(ctx, path, region.coordinates, props.color, props.pattern, size, 0.7 * (1 - reality));
              drawHatchedRegion(ctx, path, region.coordinates, props.color, props.canopyFade.revealPattern, size, 0.7 * reality);
            }
          } else {
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

          // ── 6b. Continent highlight outline — crisp stroke on the real
          // coastline, drawn last so it reads sharp over the hatching/glow.
          if (continentShape) {
            ctx.beginPath();
            path(continentShape);
            ctx.strokeStyle = props.color;
            ctx.lineWidth = 1.25;
            ctx.stroke();
          }

          // ── 6c. Sparkline chip — flat dashed line + endpoint dots,
          // reading "zero volatility" over the marked coordinate.
          if (props.sparkline && isFrontFacing(props.sparkline.position, currentRotation)) {
            const [cx, cy] = projection(props.sparkline.position)!;
            const halfW = props.sparkline.width / 2;

            ctx.save();
            ctx.strokeStyle = props.sparkline.color;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3.5]);
            ctx.beginPath();
            ctx.moveTo(cx - halfW, cy);
            ctx.lineTo(cx + halfW, cy);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = props.sparkline.color;
            for (const dx of [-halfW, halfW]) {
              ctx.beginPath();
              ctx.arc(cx + dx, cy, 3, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          // ── 6d. Threshold breach line — dashed limit line with whisker
          // end-caps, plus a warning tick rising from it. Anchored 20% down
          // from the region's real northern edge, so the hatched region
          // (which extends up to that real edge) genuinely rises above it.
          if (props.thresholdLine && thresholdAnchor && isFrontFacing(thresholdAnchor, currentRotation)) {
            const [tx, ty] = projection(thresholdAnchor)!;
            const halfW = 35;

            ctx.save();
            ctx.strokeStyle = props.thresholdLine.color;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 3.5]);
            ctx.beginPath();
            ctx.moveTo(tx - halfW, ty);
            ctx.lineTo(tx + halfW, ty);
            ctx.stroke();
            ctx.setLineDash([]);

            // Whisker end-caps — reference-line convention
            for (const dx of [-halfW, halfW]) {
              ctx.beginPath();
              ctx.moveTo(tx + dx, ty - 4);
              ctx.lineTo(tx + dx, ty + 4);
              ctx.stroke();
            }

            // Warning tick rising from the line at the breach point
            ctx.fillStyle = props.thresholdLine.tickColor;
            ctx.beginPath();
            ctx.moveTo(tx, ty - 12);
            ctx.lineTo(tx - 5, ty - 3);
            ctx.lineTo(tx + 5, ty - 3);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }

          // ── 6e. Grid network — hub-and-spoke lines from the globe's own
          // center to each real country node. Static and hemisphere-clipped
          // like everything else; the flicker lives on the DOM node dots
          // (below), not on these lines.
          if (props.gridNetwork && isFrontFacing(props.center, currentRotation)) {
            const hubPx = projection(props.center)!;

            ctx.save();
            ctx.strokeStyle = props.gridNetwork.color + "60";
            ctx.lineWidth = 1;
            for (const node of props.gridNetwork.nodes) {
              if (!isFrontFacing(node.position, currentRotation)) continue;
              const nodePx = projection(node.position)!;
              ctx.beginPath();
              ctx.moveTo(hubPx[0], hubPx[1]);
              ctx.lineTo(nodePx[0], nodePx[1]);
              ctx.stroke();
            }

            ctx.fillStyle = props.gridNetwork.color;
            ctx.beginPath();
            ctx.arc(hubPx[0], hubPx[1], 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // ── 6f. Loss ripple dots — solid circle per country, radius ∝
          // √value (so area, not radius, matches the dollar figure). The
          // expanding ripple ring around each is a DOM overlay (below).
          if (props.lossRipple) {
            ctx.save();
            ctx.fillStyle = props.lossRipple.color;
            for (const node of props.lossRipple.nodes) {
              if (!isFrontFacing(node.position, currentRotation)) continue;
              const [x, y] = projection(node.position)!;
              const r = bubbleRadius(node.value, lossRippleMaxValue);
              ctx.beginPath();
              ctx.arc(x, y, r, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          // ── 6g. Gain burst — the climax. A big soft halo behind a large
          // solid bubble with a crisp ring, all deliberately oversized
          // relative to every other marker in the piece: the payoff moment
          // gets payoff-sized visual weight. The DOM overlay (below) adds a
          // bright pulsing glow on top of this static core.
          if (props.gainBurst && isFrontFacing(props.gainBurst.position, currentRotation)) {
            const [x, y] = projection(props.gainBurst.position)!;
            const bubbleR = 34;
            const haloR = bubbleR * 2.6;

            ctx.save();
            ctx.beginPath();
            path({ type: "Sphere" });
            ctx.clip();
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, haloR);
            gradient.addColorStop(0, props.gainBurst.glowColor + "55");
            gradient.addColorStop(0.5, props.gainBurst.glowColor + "20");
            gradient.addColorStop(1, props.gainBurst.glowColor + "00");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, haloR, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.fillStyle = props.gainBurst.glowColor;
            ctx.beginPath();
            ctx.arc(x, y, bubbleR, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = props.gainBurst.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, bubbleR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // ── 7. DOM overlay position — sparkline pulse dot, threshold
          // tick glow, or gain-burst pulse. Hidden once its coordinate
          // rotates past the visible hemisphere, exactly like the
          // coastlines it sits on (same projection, same rotation, same cutoff).
          const markerEl = markerRef.value;
          if (overlayAnchor && markerEl) {
            const front = isFrontFacing(overlayAnchor, currentRotation);
            if (front) {
              const [x, y] = projection(overlayAnchor)!;
              markerEl.style.left = `${x * displayScale}px`;
              markerEl.style.top = `${y * displayScale}px`;
              markerEl.style.opacity = "1";
            } else {
              markerEl.style.opacity = "0";
            }
          }

          // ── 7b. Grid network node dots — each positioned independently
          // (unlike the single shared overlay above, this section has
          // several real anchors at once), hidden per-node on the far side.
          const networkEl = networkRef.value;
          if (props.gridNetwork && networkEl) {
            const nodeEls = networkEl.children;
            props.gridNetwork.nodes.forEach((node, i) => {
              const el = nodeEls[i] as HTMLElement | undefined;
              if (!el) return;
              const front = isFrontFacing(node.position, currentRotation);
              if (front) {
                const [x, y] = projection(node.position)!;
                el.style.left = `${x * displayScale}px`;
                el.style.top = `${y * displayScale}px`;
                el.style.opacity = "1";
              } else {
                el.style.opacity = "0";
              }
            });
          }

          // ── 7c. Loss ripple rings — same per-node positioning as the
          // grid network above, targeting the ripple container instead.
          const rippleEl = rippleRef.value;
          if (props.lossRipple && rippleEl) {
            const nodeEls = rippleEl.children;
            props.lossRipple.nodes.forEach((node, i) => {
              const el = nodeEls[i] as HTMLElement | undefined;
              if (!el) return;
              const front = isFrontFacing(node.position, currentRotation);
              if (front) {
                const [x, y] = projection(node.position)!;
                el.style.left = `${x * displayScale}px`;
                el.style.top = `${y * displayScale}px`;
                el.style.opacity = "1";
              } else {
                el.style.opacity = "0";
              }
            });
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
            // canopyFade needs the loop to keep breathing indefinitely,
            // not settle once the entrance rotation finishes.
            if (props.canopyFade) {
              frameId = requestAnimationFrame(draw);
            }
          }
        }

        // Exposed so onDragEnd can resume the crossfade after a drag —
        // dragging otherwise permanently halts this rAF chain (isDragging
        // check above returns early with nothing left to re-queue it).
        resumeAutoLoop = () => {
          if (props.canopyFade) frameId = requestAnimationFrame(draw);
        };

        frameId = requestAnimationFrame(draw);
      });

    // Placeholders — get replaced once world data loads
    let renderFrame: () => void = () => {};
    let resumeAutoLoop: () => void = () => {};
  });

  return (
    <>
      <canvas
        ref={canvasRef}
        width={480}
        height={480}
        class="mx-auto w-full max-w-[480px] h-auto touch-none"
        aria-label="Interactive globe showing ecosystem location — drag to rotate"
        role="img"
      />
      {props.sparkline && (
        <div
          ref={markerRef}
          class="absolute pointer-events-none transition-opacity duration-200 ease-linear"
          style={{ left: "0px", top: "0px", opacity: 0, transform: "translate(-50%, -50%)" }}
        >
          <div
            class="relative flex items-center justify-center transition-all duration-700 ease-out"
            style={{
              width: "12px",
              height: "12px",
              opacity: props.isVisible ? 1 : 0,
              transitionDelay: "900ms",
            }}
          >
            <span
              class="sparkline-pulse-ring absolute inset-0 rounded-full"
              style={{ backgroundColor: props.sparkline.color + "70" }}
            />
            <span
              class="relative rounded-full"
              style={{ width: "6px", height: "6px", backgroundColor: props.sparkline.color }}
            />
          </div>
        </div>
      )}
      {props.thresholdLine && (
        <div
          ref={markerRef}
          class="absolute pointer-events-none transition-opacity duration-200 ease-linear"
          style={{ left: "0px", top: "0px", opacity: 0, transform: "translate(-50%, calc(-50% - 12px))" }}
        >
          <div
            class="relative flex items-center justify-center transition-all duration-700 ease-out"
            style={{
              width: "10px",
              height: "10px",
              opacity: props.isVisible ? 1 : 0,
              transitionDelay: "900ms",
            }}
          >
            <span
              class="sparkline-pulse-ring absolute inset-0 rounded-full"
              style={{ backgroundColor: props.thresholdLine.tickColor + "70" }}
            />
          </div>
        </div>
      )}
      {props.gridNetwork && (
        <div ref={networkRef} class="absolute inset-0 pointer-events-none overflow-hidden">
          {props.gridNetwork.nodes.map((_, i) => (
            <div
              key={i}
              class="absolute transition-opacity duration-200 ease-linear"
              style={{ left: "0px", top: "0px", opacity: 0, transform: "translate(-50%, -50%)" }}
            >
              <div
                class="transition-all duration-700 ease-out"
                style={{
                  opacity: props.isVisible ? 1 : 0,
                  transitionDelay: "900ms",
                }}
              >
                <span
                  class="grid-flicker block rounded-full"
                  style={{
                    width: "6px",
                    height: "6px",
                    backgroundColor: props.gridNetwork!.color,
                    animationDelay: `${i * 700}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {props.lossRipple && (
        <div ref={rippleRef} class="absolute inset-0 pointer-events-none overflow-hidden">
          {props.lossRipple.nodes.map((node, i) => {
            const diameter = bubbleRadius(node.value, lossRippleMaxValue) * 2;
            return (
              <div
                key={i}
                class="absolute transition-opacity duration-200 ease-linear"
                style={{ left: "0px", top: "0px", opacity: 0, transform: "translate(-50%, -50%)" }}
              >
                <div
                  class="relative transition-all duration-700 ease-out"
                  style={{
                    width: `${diameter}px`,
                    height: `${diameter}px`,
                    opacity: props.isVisible ? 1 : 0,
                    transitionDelay: "900ms",
                  }}
                >
                  <span
                    class="loss-ripple absolute inset-0 rounded-full"
                    style={{
                      backgroundColor: props.lossRipple!.color,
                      animationDelay: `${i * 450}ms`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {props.gainBurst && (
        <div
          ref={markerRef}
          class="absolute pointer-events-none transition-opacity duration-200 ease-linear"
          style={{ left: "0px", top: "0px", opacity: 0, transform: "translate(-50%, -50%)" }}
        >
          <div
            class="transition-all duration-700 ease-out"
            style={{
              opacity: props.isVisible ? 1 : 0,
              transform: `scale(${props.isVisible ? 1 : 0.6})`,
              transitionDelay: "900ms",
            }}
          >
            <span
              class="gain-burst-pulse block rounded-full"
              style={{ width: "68px", height: "68px", backgroundColor: props.gainBurst.glowColor + "30" }}
            />
          </div>
        </div>
      )}
    </>
  );
});
