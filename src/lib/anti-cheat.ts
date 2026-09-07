import { getGamePlugin } from "@/lib/games";

export type AntiCheatSignal = {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  metadata?: Record<string, string | number | boolean>;
};

export type AntiCheatProvider = {
  name: string;
  inspectResult: (input: { gameSlug: string; payload: unknown }) => Promise<AntiCheatSignal[]>;
};

export const baselineAntiCheatProvider: AntiCheatProvider = {
  name: "baseline",
  async inspectResult({ gameSlug, payload }) {
    const plugin = getGamePlugin(gameSlug);
    if (!plugin) {
      return [{ type: "UNSUPPORTED_GAME", severity: "HIGH", confidence: 1 }];
    }
    const validation = plugin.validateResult(payload);
    if (!validation.valid) {
      return [{ type: "INVALID_RESULT_PAYLOAD", severity: "HIGH", confidence: 1, metadata: { reason: validation.reason ?? "invalid" } }];
    }
    return [];
  },
};
