"use client";
import { useCVStore } from "../../../_store/cv-store";
import { Field, AddBtn, RemoveBtn, ItemCard, TWO_COL, LABEL_STYLE } from "../_form-utils";

export function LanguagesSection() {
  const languages    = useCVStore((s) => s.cv.languages);
  const updatePath   = useCVStore((s) => s.updatePath);
  const addLanguage  = useCVStore((s) => s.addLanguage);
  const removeLang   = useCVStore((s) => s.removeLanguage);

  return (
    <div>
      {languages.map((l) => (
        <ItemCard key={l.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", flex: 1 }}>{l.name || "Langue"}</span>
            <RemoveBtn onClick={() => removeLang(l.id)} />
          </div>

          <div style={TWO_COL}>
            <Field label="Langue" value={l.name}  onChange={(v) => updatePath(`languages.${l.id}.name`,  v)} placeholder="Français" />
            <Field label="Niveau" value={l.level} onChange={(v) => updatePath(`languages.${l.id}.level`, v)} placeholder="Bilingue" />
          </div>

          {/* Dot-rating 1–5 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ ...LABEL_STYLE, marginBottom: 0 }}>Maîtrise</label>
            <div style={{ display: "flex", gap: 5 }}>
              {[1, 2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => updatePath(`languages.${l.id}.dots`, d)}
                  aria-label={`${d} sur 5`}
                  style={{
                    width:        18,
                    height:       18,
                    borderRadius: "50%",
                    border:       `1.5px solid ${d <= l.dots ? "#7c3aed" : "#c4b5fd"}`,
                    background:   d <= l.dots ? "#7c3aed" : "#fff",
                    cursor:       "pointer",
                    padding:      0,
                    transition:   "all .12s",
                  }}
                />
              ))}
            </div>
          </div>
        </ItemCard>
      ))}

      <AddBtn label="+ Ajouter une langue" onClick={addLanguage} />
    </div>
  );
}
