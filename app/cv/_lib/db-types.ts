/**
 * Hand-written Supabase types for the `cvs` table.
 * When you run `supabase gen types typescript` these will be superseded —
 * delete this file and update imports to the generated one.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ── Row shapes ────────────────────────────────────────────────────────────────

export interface CvRow {
  id:               string;
  user_id:          string;
  name:             string;
  data:             Json;
  template:         string;
  accent:           string;
  lang:             string;
  section_order:    Json;   // string[]
  sections_enabled: Json;   // Record<string, boolean>
  updated_at:       string; // ISO-8601
}

export interface CvInsert {
  id?:               string;
  user_id:           string;
  name?:             string;
  data?:             Json;
  template?:         string;
  accent?:           string;
  lang?:             string;
  section_order?:    Json;
  sections_enabled?: Json;
  updated_at?:       string;
}

export interface CvUpdate {
  id?:               string;
  user_id?:          string;
  name?:             string;
  data?:             Json;
  template?:         string;
  accent?:           string;
  lang?:             string;
  section_order?:    Json;
  sections_enabled?: Json;
  updated_at?:       string;
}

// ── Database helper type (mirrors Supabase generated shape) ──────────────────

export interface Database {
  public: {
    Tables: {
      cvs: {
        Row:    CvRow;
        Insert: CvInsert;
        Update: CvUpdate;
      };
    };
  };
}
