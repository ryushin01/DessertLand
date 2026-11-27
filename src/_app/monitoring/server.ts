import type { Instrumentation } from "next";

import { http } from "@/shared/api/index.server";
import { parseDsn, parseStack } from "@/shared/lib/sentry-envelope";

type ErrorRequest = Parameters<Instrumentation.onRequestError>[1];
type ErrorContext = Parameters<Instrumentation.onRequestError>[2];

/** 보내기를 기다리는 최대 시간. 오류 보고 때문에 응답이 늦어지지 않게 합니다. */
const SEND_TIMEOUT_MS = 2000;

function describe(error: unknown): {
  type: string;
  value: string;
  stack?: string;
  digest?: string;
} {
  if (error instanceof Error) {
    return {
      type: error.name,
      value: error.message,
      stack: error.stack,
      digest: (error as Error & { digest?: unknown }).digest as string | undefined,
    };
  }
  return { type: "Error", value: typeof error === "string" ? error : "Non-Error thrown" };
}

/** Sentry로 보낼 이벤트를 만듭니다. 헤더·쿠키·쿼리 문자열은 넣지 않습니다. */
export function buildServerEvent(
  error: unknown,
  request: Pick<ErrorRequest, "path" | "method">,
  context: Pick<ErrorContext, "routerKind" | "routePath" | "routeType" | "renderSource">,
  eventId: string = crypto.randomUUID().replaceAll("-", ""),
) {
  const { type, value, stack, digest } = describe(error);
  const frames = parseStack(stack);
  return {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "node",
    level: "error",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_RELEASE,
    exception: {
      values: [
        {
          type,
          value,
          mechanism: { type: "onRequestError", handled: false },
          ...(frames.length > 0 ? { stacktrace: { frames } } : {}),
        },
      ],
    },
    transaction: context.routePath,
    tags: {
      runtime: "server",
      routerKind: context.routerKind,
      routeType: context.routeType,
      ...(context.renderSource ? { renderSource: context.renderSource } : {}),
    },
    request: { method: request.method, url: request.path.split(/[?#]/)[0] },
    ...(digest ? { extra: { digest } } : {}),
  };
}

/** 서버에서 처리하지 못한 오류를 Sentry로 보냅니다. DSN이 없으면 아무것도 하지 않습니다. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const target = parseDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);
  if (!target) return;
  const event = buildServerEvent(error, request, context);
  const envelope = [
    JSON.stringify({ event_id: event.event_id, sent_at: new Date().toISOString() }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");
  try {
    await http
      .url(target.envelopeUrl)
      .content("application/x-sentry-envelope")
      .options({ signal: AbortSignal.timeout(SEND_TIMEOUT_MS) })
      .body(envelope)
      .post()
      .res();
  } catch {
    // 보고에 실패해도(네트워크 오류, 시간 초과, 2xx가 아닌 응답) 요청 처리에는 영향을 주지 않습니다.
  }
};
