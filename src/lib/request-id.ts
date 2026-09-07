import { randomUUID } from "node:crypto";

export function requestIdFrom(request: Request) {
  const supplied = request.headers.get("x-request-id")?.trim();
  return supplied && supplied.length <= 128 ? supplied : randomUUID();
}

export function withRequestId(response: Response, requestId: string) {
  response.headers.set("x-request-id", requestId);
  return response;
}
