"use client";
import { useCVStore } from "../../../_store/cv-store";
import { Field, Area, AddBtn, RemoveBtn, ItemCard } from "../_form-utils";

export function SkillsSection() {
  const skills         = useCVStore((s) => s.cv.skills);
  const updatePath     = useCVStore((s) => s.updatePath);
  const addSkillGroup  = useCVStore((s) => s.addSkillGroup);
  const removeSkillGroup = useCVStore((s) => s.removeSkillGroup);

  return (
    <div>
      {skills.map((g) => (
        <ItemCard key={g.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", flex: 1 }}>{g.group || "Groupe"}</span>
            <RemoveBtn onClick={() => removeSkillGroup(g.id)} />
          </div>

          <Field label="Groupe" value={g.group} onChange={(v) => updatePath(`skills.${g.id}.group`, v)}
            placeholder="Design, Outils & code…" />
          <Area label="Compétences (séparées par virgules)"
            value={g.items.join(", ")}
            onChange={(v) => updatePath(`skills.${g.id}.items`, v.split(",").map((x) => x.trim()).filter(Boolean))}
            rows={2}
            placeholder="Figma, Prototypage, Recherche utilisateur…" />
        </ItemCard>
      ))}

      <AddBtn label="+ Ajouter un groupe" onClick={addSkillGroup} />
    </div>
  );
}
