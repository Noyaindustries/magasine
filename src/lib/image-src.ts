import { z } from "zod";

/**
 * Valide une source d'image acceptée par l'app : URL absolue (http/https, ex. blob
 * Vercel) OU chemin relatif servi par l'app (ex. /uploads/media/xxx.png en local).
 * Autorise la chaîne vide (champ effacé) et l'absence de valeur.
 */
export const imageSrcField = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^https?:\/\//i.test(value) || value.startsWith("/"),
    "Invalid image URL",
  )
  .optional();
