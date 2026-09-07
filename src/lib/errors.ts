export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "TOURNAMENT_FULL"
  | "DUPLICATE_ENTRY"
  | "RATE_LIMITED"
  | "TOURNAMENT_BUSY"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function apiError(error: unknown) {
  if (error instanceof AppError) {
    return { status: error.status, body: { success: false, error: { code: error.code, message: error.message } } };
  }

  return {
    status: 500,
    body: { success: false, error: { code: "INTERNAL_ERROR" as const, message: "Something went wrong." } },
  };
}
