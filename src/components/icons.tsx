// icons.tsx — Feather-style inline SVG icons + the Sentire mark.
// Ported from SIco / Icon / Mark in bir-shell.jsx.

import type { CSSProperties } from "react";

export const SIco = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11",
  plus: "M12 5v14M5 12h14",
  print: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
  back: "M19 12H5M12 19l-7-7 7-7",
  trash: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z",
  check: "M20 6L9 17l-5-5",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",
  chevR: "M9 18l6-6-6-6",
  x: "M18 6L6 18M6 6l12 12",
  copy: "M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  warn: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  zoomIn: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35M11 8v6M8 11h6",
  zoomOut: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35M8 11h6",
  code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16v-4M12 8h.01",
} as const;

export type IconName = keyof typeof SIco;

export function Icon({
  d,
  size = 17,
  stroke = 1.7,
  style,
  className,
}: {
  d: string;
  size?: number;
  stroke?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden="true"
    >
      {d
        .split("M")
        .filter(Boolean)
        .map((p, i) => (
          <path key={i} d={"M" + p} />
        ))}
    </svg>
  );
}

export function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ display: "block", flex: "none" }}>
      <g stroke="#F7F3EF" strokeWidth="3.4" strokeLinecap="round" opacity="0.5">
        <line x1="24" y1="24" x2="24" y2="11.5" />
        <line x1="24" y1="24" x2="38.5" y2="24" />
        <line x1="24" y1="24" x2="19.55" y2="36.22" />
        <line x1="24" y1="24" x2="10.84" y2="19.21" />
      </g>
      <g stroke="#F7F3EF" strokeWidth="2.55" strokeLinecap="round" opacity="0.18">
        <line x1="24" y1="11.5" x2="38.5" y2="24" />
        <line x1="38.5" y1="24" x2="19.55" y2="36.22" />
        <line x1="19.55" y1="36.22" x2="10.84" y2="19.21" />
        <line x1="10.84" y1="19.21" x2="24" y2="11.5" />
      </g>
      <circle cx="24" cy="11.5" r="3.68" fill="#F7F3EF" />
      <circle cx="38.5" cy="24" r="4.13" fill="#F7F3EF" />
      <circle cx="19.55" cy="36.22" r="3.85" fill="#F7F3EF" />
      <circle cx="10.84" cy="19.21" r="3.43" fill="#F7F3EF" />
      <circle cx="24" cy="24" r="5" fill="#E8693A" />
    </svg>
  );
}

/** Relative-time label (e.g. "3m ago"). */
export function timeAgo(ts?: number): string {
  if (!ts) return "—";
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  if (s < 604800) return Math.floor(s / 86400) + "d ago";
  return new Date(ts).toLocaleDateString();
}
