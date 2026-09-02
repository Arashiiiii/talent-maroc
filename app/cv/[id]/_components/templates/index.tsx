"use client";

/**
 * Template dispatch + shared constants.
 *
 * CVRender is the single entry point used by:
 *   - CVPreview (builder, interactive)
 *   - TplThumb (strip thumbnails, interactive, scaled)
 *   - PrintPage (server, readOnly)
 *
 * Marked "use client" so PrintPage (a Server Component) can render it directly:
 * everything below builds onChange closures for InlineEditable ("use client"),
 * and a Server Component can't pass function props across that boundary.
 */

import type { CVData, SectionId, TemplateId, Lang } from "../../../_lib/schema";
import { Corso    } from "./Corso";
import { Meridian } from "./Meridian";
import { Aria     } from "./Aria";
import { Dahab    } from "./Dahab";
import { Medina   } from "./Medina";
import { Vertex   } from "./Vertex";
import { Atlas    } from "./Atlas";
import { Lumen    } from "./Lumen";
import { Helix    } from "./Helix";
import { Slate    } from "./Slate";

/** A4 at 96 dpi — used by every template and the preview stage. */
export const A4_W = 794;
export const A4_H = 1123;

export interface TemplateProps {
  cv:       CVData;
  accent:   string;
  lang:     Lang;
  order:    SectionId[];
  enabled:  Record<SectionId, boolean>;
  /** Path-based update callback (mirrors store.updatePath). Omitted in print (readOnly). */
  onUpdate?: (path: string, value: unknown) => void;
  /** True in the print route — disables contentEditable. */
  readOnly?: boolean;
}

export function CVRender(props: TemplateProps & { template: TemplateId }) {
  const { template, ...rest } = props;
  switch (template) {
    case "corso":    return <Corso    {...rest} />;
    case "meridian": return <Meridian {...rest} />;
    case "aria":     return <Aria     {...rest} />;
    case "dahab":    return <Dahab    {...rest} />;
    case "medina":   return <Medina   {...rest} />;
    case "vertex":   return <Vertex   {...rest} />;
    case "atlas":    return <Atlas    {...rest} />;
    case "lumen":    return <Lumen    {...rest} />;
    case "helix":    return <Helix    {...rest} />;
    case "slate":    return <Slate    {...rest} />;
    default:         return <Corso    {...rest} />;
  }
}
