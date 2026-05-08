"use client";
import { useCVStore } from "../../../_store/cv-store";
import { Field, AddBtn, RemoveBtn, ItemCard, TWO_COL } from "../_form-utils";

export function CertsSection() {
  const certs      = useCVStore((s) => s.cv.certifications);
  const updatePath = useCVStore((s) => s.updatePath);
  const addCert    = useCVStore((s) => s.addCert);
  const removeCert = useCVStore((s) => s.removeCert);

  return (
    <div>
      {certs.map((c) => (
        <ItemCard key={c.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", flex: 1 }}>{c.name || "Certification"}</span>
            <RemoveBtn onClick={() => removeCert(c.id)} />
          </div>
          <Field label="Nom" value={c.name} onChange={(v) => updatePath(`certifications.${c.id}.name`, v)}
            placeholder="Nielsen Norman UX Master" />
          <div style={TWO_COL}>
            <Field label="Émetteur" value={c.issuer ?? ""} onChange={(v) => updatePath(`certifications.${c.id}.issuer`, v)} placeholder="NN/g" />
            <Field label="Année"    value={c.year  ?? ""} onChange={(v) => updatePath(`certifications.${c.id}.year`,   v)} placeholder="2024" />
          </div>
        </ItemCard>
      ))}

      <AddBtn label="+ Ajouter une certification" onClick={addCert} />
    </div>
  );
}
