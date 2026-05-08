"use client";
import { useRef, useState } from "react";
import { useCVStore }      from "../../_store/cv-store";
import { Field, TWO_COL }  from "./_form-utils";
import { PhotoCropModal }  from "./PhotoCropModal";

export function ProfileCard() {
  const cv         = useCVStore((s) => s.cv);
  const updatePath = useCVStore((s) => s.updatePath);

  const fileRef              = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const p   = cv.profile;
  const upd = (path: string, v: string) => updatePath(path, v);

  const initials = ((p.firstName?.[0] ?? "") + (p.lastName?.[0] ?? "")).toUpperCase() || "?";

  // Read the file as a data-URL and hand it to the crop modal
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = (base64: string) => {
    updatePath("profile.photo", base64);
    setCropSrc(null);
  };

  return (
    <>
      {cropSrc && (
        <PhotoCropModal
          imageSrc={cropSrc}
          onCrop={handleCropConfirm}
          onClose={() => setCropSrc(null)}
        />
      )}

      <div style={{
        border:       "1px solid #e5e7eb",
        borderRadius: 14,
        marginBottom: 14,
        background:   "#fff",
        padding:      "16px 14px 18px",
      }}>

        {/* ── Photo + name row ─────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, marginBottom: 10 }}>

          {/* Avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div
              onClick={() => fileRef.current?.click()}
              title="Cliquez pour changer la photo"
              style={{
                width:          80,
                height:         80,
                borderRadius:   14,
                background:     p.photo ? "transparent" : "#f5f3ff",
                border:         "1px dashed #c4b5fd",
                cursor:         "pointer",
                position:       "relative",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                overflow:       "hidden",
                flexShrink:     0,
              }}
            >
              {p.photo ? (
                <img src={p.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ textAlign: "center", padding: 6 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#7c3aed", lineHeight: 1 }}>{initials}</div>
                  <div style={{ fontSize: 9.5, color: "#9ca3af", fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>
                    + Photo<br />
                    <span style={{ fontWeight: 400 }}>cliquer</span>
                  </div>
                </div>
              )}

              {/* Hover overlay */}
              {p.photo && (
                <div
                  style={{
                    position:       "absolute",
                    inset:          0,
                    background:     "rgba(0,0,0,.45)",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    opacity:        0,
                    transition:     "opacity .15s",
                    color:          "#fff",
                    fontSize:       10,
                    fontWeight:     600,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  Modifier
                </div>
              )}
            </div>

            {/* Remove photo button */}
            {p.photo && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); updatePath("profile.photo", ""); }}
                style={{
                  fontSize:    9.5,
                  fontWeight:  600,
                  color:       "#ef4444",
                  background:  "transparent",
                  border:      "none",
                  cursor:      "pointer",
                  padding:     "1px 4px",
                  fontFamily:  "inherit",
                }}
              >
                Supprimer
              </button>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileSelect} />

          {/* Name + title */}
          <div>
            <div style={TWO_COL}>
              <Field label="Prénom" value={p.firstName} onChange={(v) => upd("profile.firstName", v)} placeholder="Yasmine" />
              <Field label="Nom"    value={p.lastName}  onChange={(v) => upd("profile.lastName",  v)} placeholder="El Amrani" />
            </div>
            <Field label="Titre du poste" value={p.title} onChange={(v) => upd("profile.title", v)} placeholder="Product Designer Senior" />
          </div>
        </div>

        {/* ── Contact grid ─────────────────────────────────────────────────── */}
        <div style={TWO_COL}>
          <Field label="Email"     value={p.email}        onChange={(v) => upd("profile.email",    v)} placeholder="yasmine@email.ma" />
          <Field label="Téléphone" value={p.phone}        onChange={(v) => upd("profile.phone",    v)} placeholder="+212 6 61 00 00 00" />
          <Field label="Ville"     value={p.city}         onChange={(v) => upd("profile.city",     v)} placeholder="Casablanca, Maroc" />
          <Field label="LinkedIn"  value={p.linkedin ?? ""} onChange={(v) => upd("profile.linkedin", v)} placeholder="linkedin.com/in/…" />
        </div>
        <Field label="Site web / Portfolio" value={p.website ?? ""} onChange={(v) => upd("profile.website", v)} placeholder="monsite.com" />

      </div>
    </>
  );
}
