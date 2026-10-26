import "server-only";
import { unstable_cache } from "next/cache";
import { getRepo } from "./repo";

export const savedTag = (userId: string) => `saved-${userId}`;

/** Ids salvos pela pessoa ("Quero ir" e "Já fui"), em cache até ela mudar algo. */
export function getSaved(userId: string): Promise<{ want: string[]; been: string[] }> {
  return unstable_cache(() => getRepo().savedIndex(userId), ["saved", userId], {
    revalidate: 600,
    tags: [savedTag(userId)],
  })();
}
