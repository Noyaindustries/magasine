import { z } from "zod";
import { normalizeAuthorIds } from "@/lib/format-authors";

export const authorIdsInputSchema = z
  .object({
    authorIds: z.array(z.string().min(1)).min(1).optional(),
    authorId: z.string().min(1).optional(),
  })
  .refine(
    (data) => normalizeAuthorIds(data.authorIds, data.authorId) !== null,
    "At least one author is required"
  );

export function resolveAuthorIdsFromInput(input: {
  authorIds?: string[];
  authorId?: string;
}): string[] {
  const ids = normalizeAuthorIds(input.authorIds, input.authorId);
  if (!ids) {
    throw new Error("At least one author is required");
  }
  return ids;
}
