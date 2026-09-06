/**
 * Dodo Payments product IDs — one per CV template. Every template requires
 * its own one-time purchase; ownership is permanent once paid (see
 * cv_template_purchases table and /api/dodo/webhook).
 */

import type { TemplateId } from "./schema";

export const CV_TEMPLATE_PRODUCTS: Record<TemplateId, string> = {
  corso:    "pdt_0NmyTQfZOAqrbNNsdpHu1",
  meridian: "pdt_0NmyTDTHjyBMLteChHs6H",
  aria:     "pdt_0NmyQKSFU9uTJ5O256iMR",
  dahab:    "pdt_0Nedx6ruqwdMuBAd0SJ77",
  medina:   "pdt_0NedxFwknfkk0axVSSY7A",
  vertex:   "pdt_0NedxKs6tWNUF4rhcsRZH",
  atlas:    "pdt_0NedxRmn8JU3hAE1PTyy6",
  lumen:    "pdt_0NedxVccQXSaNhWD0T0Ka",
  helix:    "pdt_0NedxbbZDXK8mZvfBwAam",
  slate:    "pdt_0Nedxgc46iDq4jSHjcNtP",
};
