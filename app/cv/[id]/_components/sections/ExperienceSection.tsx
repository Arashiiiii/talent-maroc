"use client";
import { useCVStore } from "../../../_store/cv-store";
import { Field, Area, AddBtn, AIBtn, RemoveBtn, ItemCard, TWO_COL, LABEL_STYLE } from "../_form-utils";
import { useAIRewrite } from "../../_hooks/useAIRewrite";

export function ExperienceSection() {
  const experience       = useCVStore((s) => s.cv.experience);
  const updatePath       = useCVStore((s) => s.updatePath);
  const addExperience    = useCVStore((s) => s.addExperience);
  const removeExperience = useCVStore((s) => s.removeExperience);
  const addBullet        = useCVStore((s) => s.addBullet);
  const removeBullet     = useCVStore((s) => s.removeBullet);
  const { rewrite, rewriting } = useAIRewrite();

  return (
    <div>
      {experience.map((e, idx) => {
        const base = `experience.${e.id}`;
        return (
          <ItemCard key={e.id}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", flex: 1 }}>
                {e.role || "Nouveau poste"}{e.company ? ` · ${e.company}` : ""}
              </span>
              <RemoveBtn onClick={() => removeExperience(e.id)} />
            </div>

            {/* Role + Company */}
            <div style={TWO_COL}>
              <Field label="Poste"      value={e.role}    onChange={(v) => updatePath(`${base}.role`,    v)} placeholder="Lead Designer" />
              <Field label="Entreprise" value={e.company} onChange={(v) => updatePath(`${base}.company`, v)} placeholder="BMCE Capital" />
            </div>

            {/* City + Dates */}
            <div style={TWO_COL}>
              <Field label="Ville" value={e.city ?? ""} onChange={(v) => updatePath(`${base}.city`, v)} placeholder="Casablanca" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <Field label="Début" value={e.start}      onChange={(v) => updatePath(`${base}.start`, v)} placeholder="Mars 2023" />
                <Field label="Fin"   value={e.current ? "Présent" : (e.end ?? "")} disabled={!!e.current}
                  onChange={(v) => updatePath(`${base}.end`, v)} placeholder="Déc 2024" />
              </div>
            </div>

            {/* Current checkbox */}
            <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "#475569", marginBottom: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={!!e.current}
                onChange={(ev) => updatePath(`${base}.current`, ev.target.checked)}
                style={{ accentColor: "#7c3aed" }}
              />
              Poste actuel
            </label>

            {/* Bullets */}
            <label style={LABEL_STYLE}>Réalisations</label>
            {e.bullets.map((b, bi) => (
              <div key={bi} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "flex-start" }}>
                {/* Numbered dot */}
                <div style={{
                  width: 16, height: 16, marginTop: 6,
                  borderRadius: "50%", background: "#7c3aed", color: "#fff",
                  fontSize: 9, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {bi + 1}
                </div>
                <textarea
                  value={b}
                  rows={2}
                  onChange={(ev) => updatePath(`${base}.bullets.${bi}`, ev.target.value)}
                  onFocus={(ev) => { ev.target.style.borderColor = "#7c3aed"; ev.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,.12)"; }}
                  onBlur={(ev)  => { ev.target.style.borderColor = "#e5e7eb"; ev.target.style.boxShadow = "none"; }}
                  style={{
                    flex: 1, padding: "6px 9px", border: "1px solid #e5e7eb",
                    borderRadius: 7, fontSize: 12, fontFamily: "inherit",
                    color: "#0f172a", background: "#fff", outline: "none",
                    resize: "vertical", lineHeight: 1.5, minHeight: 38,
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <AIBtn
                    onClick={() => rewrite(`experience.${e.id}.bullets.${bi}`, b, "bullet")}
                    loading={rewriting === `experience.${e.id}.bullets.${bi}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeBullet(e.id, bi)}
                    style={{
                      width: 24, height: 24, borderRadius: 5,
                      border: "1px solid #e5e7eb", background: "#fff",
                      color: "#94a3b8", fontSize: 13, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >×</button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addBullet(e.id)}
              style={{
                width: "100%", padding: "7px", borderRadius: 7,
                border: "1px dashed #e5e7eb", background: "transparent",
                color: "#94a3b8", fontSize: 11.5, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", marginTop: 2,
              }}
            >
              + Ajouter une réalisation
            </button>
          </ItemCard>
        );
      })}

      <AddBtn label="+ Ajouter une expérience" onClick={addExperience} />
    </div>
  );
}
