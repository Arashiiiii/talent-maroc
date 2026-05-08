"use client";
import { useCVStore } from "../../../_store/cv-store";
import { Area } from "../_form-utils";

export function InterestsSection() {
  const interests     = useCVStore((s) => s.cv.interests);
  const setInterests  = useCVStore((s) => s.setInterests);

  return (
    <Area
      value={interests.join(", ")}
      onChange={setInterests}
      placeholder="Photographie argentique, Course longue distance, Typographie arabe…"
      rows={3}
    />
  );
}
