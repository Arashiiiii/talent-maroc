"use client";
/**
 * CVForm — the left column of the builder.
 *
 * Architecture
 * ─────────────
 * - ProfileCard is fixed at the top, never sortable.
 * - The 8 CV sections are wrapped in a DndContext + SortableContext.
 *   Dragging the grip handle on a SectionShell reorders via store.reorderSections.
 * - Each SectionShell renders the matching section component as its child.
 * - All data mutations go through store.updatePath — the same path used by
 *   inline-edit spans in the preview, so there is no duplicated state.
 *
 * DragOverlay
 * ─────────────
 * While dragging, a ghost panel shows the section label so the user always
 * knows what they're moving. The real card stays in its original position
 * (at 35% opacity) until drop.
 */

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";

import { useCVStore } from "../../_store/cv-store";
import { SECTION_META, type SectionId } from "../../_lib/schema";

import { ProfileCard }      from "./ProfileCard";
import { SectionShell }     from "./SectionShell";
import { SummarySection }   from "./sections/SummarySection";
import { ExperienceSection } from "./sections/ExperienceSection";
import { EducationSection } from "./sections/EducationSection";
import { SkillsSection }    from "./sections/SkillsSection";
import { LanguagesSection } from "./sections/LanguagesSection";
import { CertsSection }     from "./sections/CertsSection";
import { ProjectsSection }  from "./sections/ProjectsSection";
import { InterestsSection } from "./sections/InterestsSection";

// ─────────────────────────────────────────────────────────────────────────────
// Section count helpers — shown as badges on collapsed headers
// ─────────────────────────────────────────────────────────────────────────────

function useSectionCount(sec: SectionId): number | null {
  return useCVStore((s) => {
    const cv = s.cv;
    switch (sec) {
      case "experience":     return cv.experience.length;
      case "education":      return cv.education.length;
      case "skills":         return cv.skills.reduce((n, g) => n + g.items.length, 0);
      case "languages":      return cv.languages.length;
      case "certifications": return cv.certifications.length;
      case "projects":       return cv.projects.length;
      case "interests":      return cv.interests.length;
      default:               return null;
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SortableSection — thin wrapper that reads its own count + enabled state
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_DEFAULTS: Partial<Record<SectionId, boolean>> = {
  summary:    true,
  experience: true,
  education:  true,
};

function SortableSection({ id }: { id: SectionId }) {
  const enabled        = useCVStore((s) => s.enabled[id]);
  const toggleSection  = useCVStore((s) => s.toggleSection);
  const count          = useSectionCount(id);

  return (
    <SectionShell
      id={id}
      count={count}
      enabled={enabled}
      onToggleEnabled={() => toggleSection(id)}
      defaultOpen={SECTION_DEFAULTS[id] ?? false}
    >
      <SectionBody id={id} />
    </SectionShell>
  );
}

function SectionBody({ id }: { id: SectionId }) {
  switch (id) {
    case "summary":        return <SummarySection />;
    case "experience":     return <ExperienceSection />;
    case "education":      return <EducationSection />;
    case "skills":         return <SkillsSection />;
    case "languages":      return <LanguagesSection />;
    case "certifications": return <CertsSection />;
    case "projects":       return <ProjectsSection />;
    case "interests":      return <InterestsSection />;
    default:               return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CVForm root
// ─────────────────────────────────────────────────────────────────────────────

export function CVForm() {
  const order           = useCVStore((s) => s.order);
  const reorderSections = useCVStore((s) => s.reorderSections);

  const [activeId, setActiveId] = useState<SectionId | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 8 px of movement before activating a drag.
      // This lets click events on the grip button still register as clicks.
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as SectionId);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIdx = order.indexOf(active.id as SectionId);
    const newIdx = order.indexOf(over.id  as SectionId);
    reorderSections(arrayMove(order, oldIdx, newIdx));
  };

  return (
    <div
      style={{
        width:    "100%",
        height:   "100%",
        overflowY: "auto",
        background: "#fff",
        borderRight: "1px solid #e5e7eb",
      }}
    >
      <div style={{ padding: "20px 20px 80px", maxWidth: 520, margin: "0 auto" }}>

        {/* Fixed profile card — never sortable */}
        <ProfileCard />

        {/* Sortable section list */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            {order.map((sec) => (
              <SortableSection key={sec} id={sec} />
            ))}
          </SortableContext>

          {/* Ghost panel while dragging */}
          <DragOverlay dropAnimation={null}>
            {activeId ? (
              <div style={{
                border:       "1.5px solid #7c3aed",
                borderRadius: 12,
                padding:      "12px 14px",
                background:   "#fff",
                boxShadow:    "0 8px 24px rgba(124,58,237,.2)",
                fontSize:     13,
                fontWeight:   600,
                color:        "#7c3aed",
                cursor:       "grabbing",
                userSelect:   "none",
              }}>
                {SECTION_META[activeId].icon} {SECTION_META[activeId].label}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

      </div>
    </div>
  );
}
