"use client";
import { useCVStore } from "../../../_store/cv-store";
import { Field, Area, AddBtn, RemoveBtn, ItemCard, TWO_COL } from "../_form-utils";

export function EducationSection() {
  const education      = useCVStore((s) => s.cv.education);
  const updatePath     = useCVStore((s) => s.updatePath);
  const addEducation   = useCVStore((s) => s.addEducation);
  const removeEducation = useCVStore((s) => s.removeEducation);

  return (
    <div>
      {education.map((ed) => {
        const base = `education.${ed.id}`;
        return (
          <ItemCard key={ed.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", flex: 1 }}>
                {ed.degree || "Nouvelle formation"}
              </span>
              <RemoveBtn onClick={() => removeEducation(ed.id)} />
            </div>

            <Field label="Diplôme" value={ed.degree} onChange={(v) => updatePath(`${base}.degree`, v)} placeholder="Master en Design Interactif" />
            <div style={TWO_COL}>
              <Field label="École" value={ed.school} onChange={(v) => updatePath(`${base}.school`, v)} placeholder="ENSA Casablanca" />
              <Field label="Ville" value={ed.city ?? ""} onChange={(v) => updatePath(`${base}.city`, v)} placeholder="Casablanca" />
              <Field label="Début" value={ed.start} onChange={(v) => updatePath(`${base}.start`, v)} placeholder="2016" />
              <Field label="Fin"   value={ed.end}   onChange={(v) => updatePath(`${base}.end`,   v)} placeholder="2018" />
            </div>
            <Area label="Détails (optionnel)" value={ed.detail ?? ""} onChange={(v) => updatePath(`${base}.detail`, v)} rows={2}
              placeholder="Mention Très Bien — mémoire sur l'inclusion numérique." />
          </ItemCard>
        );
      })}

      <AddBtn label="+ Ajouter une formation" onClick={addEducation} />
    </div>
  );
}
