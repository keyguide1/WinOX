import { z } from "zod";

const environmentSchema = z.object({
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  PAYMENT_PROVIDER_KEY: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  REAL_MONEY_ENABLED: z.enum(["true", "false"]).default("false"),
  SECURITY_ENGINE_ENABLED: z.enum(["true", "false"]).default("true"),
  ANTI_CHEAT_ENABLED: z.enum(["true", "false"]).default("true"),
  FRAUD_ENGINE_ENABLED: z.enum(["true", "false"]).default("true"),
  BOT_DETECTION_ENABLED: z.enum(["true", "false"]).default("true"),
  COLLUSION_DETECTION_ENABLED: z.enum(["true", "false"]).default("true"),
  RISK_ENGINE_ENABLED: z.enum(["true", "false"]).default("true"),
  KYC_PROVIDER_KEY: z.string().optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),
});

export function parseEnvironment(environment: NodeJS.ProcessEnv = process.env) {
  return environmentSchema.parse({
    DATABASE_URL: environment.DATABASE_URL,
    REDIS_URL: environment.REDIS_URL,
    SESSION_SECRET: environment.SESSION_SECRET,
    PAYMENT_PROVIDER_KEY: environment.PAYMENT_PROVIDER_KEY,
    PAYMENT_WEBHOOK_SECRET: environment.PAYMENT_WEBHOOK_SECRET,
    REAL_MONEY_ENABLED: environment.REAL_MONEY_ENABLED,
    SECURITY_ENGINE_ENABLED: environment.SECURITY_ENGINE_ENABLED,
    ANTI_CHEAT_ENABLED: environment.ANTI_CHEAT_ENABLED,
    FRAUD_ENGINE_ENABLED: environment.FRAUD_ENGINE_ENABLED,
    BOT_DETECTION_ENABLED: environment.BOT_DETECTION_ENABLED,
    COLLUSION_DETECTION_ENABLED: environment.COLLUSION_DETECTION_ENABLED,
    RISK_ENGINE_ENABLED: environment.RISK_ENGINE_ENABLED,
    KYC_PROVIDER_KEY: environment.KYC_PROVIDER_KEY,
    APP_URL: environment.APP_URL,
  });
}

export function validateRuntimeConfiguration(environment: NodeJS.ProcessEnv = process.env) {
  const parsed = parseEnvironment(environment);
  if (environment.NODE_ENV === "production") {
    if (!parsed.DATABASE_URL) throw new Error("DATABASE_URL is required in production.");
    if (!parsed.SESSION_SECRET) throw new Error("SESSION_SECRET is required in production.");
  }
  return parsed;
}

// Runtime validation is exposed for startup checks without making build-time
// route collection depend on deployment-only secrets.
const parsed = parseEnvironment();

export const config = {
  appUrl: parsed.APP_URL,
  realMoneyEnabled: parsed.REAL_MONEY_ENABLED === "true",
  emergencyControls: {
    depositsEnabled: false,
    withdrawalsEnabled: false,
    paidTournamentsEnabled: false,
    settlementsEnabled: false,
  },
  databaseUrl: parsed.DATABASE_URL,
  redisUrl: parsed.REDIS_URL,
  sessionSecret: parsed.SESSION_SECRET,
  supportedCountries: ["GH"],
  baseCurrency: "GHS",
  minimumAge: 18,
  maintenanceMode: false,
  security: {
    engineEnabled: parsed.SECURITY_ENGINE_ENABLED === "true",
    antiCheatEnabled: parsed.ANTI_CHEAT_ENABLED === "true",
    fraudEngineEnabled: parsed.FRAUD_ENGINE_ENABLED === "true",
    botDetectionEnabled: parsed.BOT_DETECTION_ENABLED === "true",
    collusionDetectionEnabled: parsed.COLLUSION_DETECTION_ENABLED === "true",
    riskEngineEnabled: parsed.RISK_ENGINE_ENABLED === "true",
  },
  tournament: {
    maxCapacity: 10_000,
    platformFeeBps: 500,
  },
  limits: {
    depositMinor: 1_000_000,
    withdrawalMinor: 1_000_000,
  },
} as const;
