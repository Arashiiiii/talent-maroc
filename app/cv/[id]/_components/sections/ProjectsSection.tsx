"use client";
import { useCVStore } from "../../../_store/cv-store";
import { Field, Area, AddBtn, RemoveBtn, ItemCard, TWO_COL } from "../_form-utils";

export function ProjectsSection() {
  const projects      = useCVStore((s) => s.cv.projects);
  const updatePath    = useCVStore((s) => s.updatePath);
  const addProject    = useCVStore((s) => s.addProject);
  const removeProject = useCVStore((s) => s.removeProject);

  return (
    <div>
      {projects.map((p) => (
        <ItemCard key={p.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", flex: 1 }}>{p.name || "Projet"}</span>
            <RemoveBtn onClick={() => removeProject(p.id)} />
          </div>
          <div style={TWO_COL}>
            <Field label="Nom"  value={p.name}     onChange={(v) => updatePath(`projects.${p.id}.name`, v)} placeholder="Atlas Pay" />
            <Field label="Rôle" value={p.role ?? ""} onChange={(v) => updatePath(`projects.${p.id}.role`, v)} placeholder="Lead Designer" />
          </div>
          <Area label="Description" value={p.detail} onChange={(v) => updatePath(`projects.${p.id}.detail`, v)} rows={2}
            placeholder="App de paiement P2P — 80K MAU." />
        </ItemCard>
      ))}

      <AddBtn label="+ Ajouter un projet" onClick={addProject} />
    </div>
  );
}
