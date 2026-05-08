"use client";

interface Props {
  zoom:         number;
  isAutoFit:    boolean;
  onAdjust:     (delta: number) => void;
  onToggleFit:  () => void;
}

export function ZoomControls({ zoom, isAutoFit, onAdjust, onToggleFit }: Props) {
  const btn = (label: string, onClick: () => void, active = false, wide = false) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        width:          wide ? "auto" : 24,
        height:         24,
        padding:        wide ? "0 8px" : 0,
        borderRadius:   5,
        border:         "none",
        background:     active ? "#f5f3ff" : "transparent",
        color:          active ? "#7c3aed" : "#475569",
        fontSize:       wide ? 10 : 13,
        fontWeight:     600,
        cursor:         "pointer",
        fontFamily:     "inherit",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      display:     "flex",
      gap:         2,
      background:  "#fff",
      border:      "1px solid #e5e7eb",
      borderRadius: 8,
      padding:     3,
      alignItems:  "center",
    }}>
      {btn("−", () => onAdjust(-0.1))}
      <span style={{ fontSize: 11, color: "#475569", minWidth: 36, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
        {Math.round(zoom * 100)}%
      </span>
      {btn("+", () => onAdjust(+0.1))}
      <div style={{ width: 1, height: 14, background: "#e5e7eb", margin: "0 2px" }} />
      {btn("Ajuster", onToggleFit, isAutoFit, true)}
    </div>
  );
}
