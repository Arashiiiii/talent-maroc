"use client";
import { scoreColor } from "../../_lib/score";

interface Props {
  value: number;
  size?: number;
}

export function ScoreRing({ value, size = 22 }: Props) {
  const r    = size / 2 - 2;
  const circ = 2 * Math.PI * r;
  const off  = circ * (1 - Math.min(100, Math.max(0, value)) / 100);
  const color = scoreColor(value);

  return (
    <svg width={size} height={size} style={{ display: "block", flexShrink: 0 }}>
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
      {/* Progress */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray={circ}
        strokeDashoffset={off}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset .4s ease, stroke .3s ease" }}
      />
    </svg>
  );
}
