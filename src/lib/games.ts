import { z } from "zod";

export type GamePlugin = {
  slug: string;
  version: string;
  validateResult: (payload: unknown) => { valid: boolean; reason?: string };
};

const scorePayload = z.object({
  score: z.number().int().min(0),
  evidenceUrl: z.string().url().optional(),
});

export const gamePlugins: Record<string, GamePlugin> = {
  valorant: {
    slug: "valorant",
    version: "1",
    validateResult: (payload) => {
      const result = scorePayload.safeParse(payload);
      return result.success ? { valid: true } : { valid: false, reason: "Invalid score payload." };
    },
  },
};

export function getGamePlugin(slug: string) {
  return gamePlugins[slug];
}
