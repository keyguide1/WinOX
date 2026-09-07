import { z } from "zod";

export const idSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const tournamentConfigSchema = z.object({
  name: z.string().trim().min(3).max(80),
  gameId: idSchema,
  capacity: z.number().int().min(2).max(10_000),
  startsAt: z.coerce.date().refine((date) => date.getTime() > Date.now(), "Tournament must start in the future."),
});

export const demoModeEnabled = process.env.REAL_MONEY_ENABLED !== "true";
