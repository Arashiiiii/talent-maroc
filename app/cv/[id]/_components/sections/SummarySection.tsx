"use client";
import { useCVStore } from "../../../_store/cv-store";
import { Area, AIBtn } from "../_form-utils";
import { useAIRewrite } from "../../_hooks/useAIRewrite";

export function SummarySection() {
  const summary    = useCVStore((s) => s.cv.summary);
  const updatePath = useCVStore((s) => s.updatePath);
  const { rewrite, rewriting } = useAIRewrite();

  return (
    <div>
      <Area
        value={summary}
        onChange={(v) => updatePath("summary", v)}
        placeholder="2–3 phrases qui résument votre parcours et ce que vous cherchez."
        rows={5}
      />
      <AIBtn
        onClick={() => rewrite("summary", summary, "summary")}
        loading={rewriting === "summary"}
        label="Reformuler avec l'IA"
      />
    </div>
  );
}
