"use client";
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

interface Props {
  imageSrc: string;
  onCrop:   (base64: string) => void;
  onClose:  () => void;
}

// Draws the crop area onto a 400×400 canvas and returns a JPEG data URL.
// 400 px is sufficient for a CV headshot and keeps the base64 string compact.
function cropToBase64(src: string, px: Area): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const SIZE   = 400;
      const canvas = document.createElement("canvas");
      canvas.width  = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, px.x, px.y, px.width, px.height, 0, 0, SIZE, SIZE);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = src;
  });
}

export function PhotoCropModal({ imageSrc, onCrop, onClose }: Props) {
  const [crop,   setCrop]   = useState({ x: 0, y: 0 });
  const [zoom,   setZoom]   = useState(1);
  const [pixels, setPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!pixels) return;
    try {
      const base64 = await cropToBase64(imageSrc, pixels);
      onCrop(base64);
    } catch {
      // Silently ignore — user can try again
    }
  };

  return (
    <div
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         9999,
        background:     "rgba(15,23,42,.65)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background:    "#fff",
        borderRadius:  16,
        width:         440,
        maxWidth:      "calc(100vw - 32px)",
        padding:       "22px 22px 18px",
        display:       "flex",
        flexDirection: "column",
        gap:           14,
        boxShadow:     "0 24px 64px rgba(0,0,0,.28)",
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Recadrer la photo
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              width:        28, height:      28,
              borderRadius: 8,  border:      "none",
              background:   "#f1f5f9",
              color:        "#64748b",
              fontSize:     16, fontWeight:  400,
              cursor:       "pointer",
              display:      "flex", alignItems: "center", justifyContent: "center",
              lineHeight:   1,
            }}
          >×</button>
        </div>

        {/* Cropper stage */}
        <div style={{
          position:     "relative",
          width:        "100%",
          height:       300,
          background:   "#1e293b",
          borderRadius: 10,
          overflow:     "hidden",
        }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, flexShrink: 0 }}>🔍</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.02}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: "#7c3aed", cursor: "pointer" }}
          />
          <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 28, textAlign: "right" }}>
            {zoom.toFixed(1)}×
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding:      "8px 18px",
              borderRadius: 8,
              border:       "1px solid #e5e7eb",
              background:   "#fff",
              color:        "#475569",
              fontSize:     13,
              fontWeight:   600,
              cursor:       "pointer",
              fontFamily:   "inherit",
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              padding:      "8px 18px",
              borderRadius: 8,
              border:       "none",
              background:   "#7c3aed",
              color:        "#fff",
              fontSize:     13,
              fontWeight:   600,
              cursor:       "pointer",
              fontFamily:   "inherit",
            }}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
