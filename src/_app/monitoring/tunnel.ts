import { parseDsn } from "@/shared/lib/sentry-envelope";
import { clientKey, createRateLimiter } from "@/shared/lib/rate-limit";

/** 브라우저 오류 묶음 하나의 최대 크기. Sentry의 envelope 상한(압축 전 수 MB)보다 작게 둡니다. */
const MAX_ENVELOPE_BYTES = 256 * 1024;

const limiter = createRateLimiter(60, 60_000);

/**
 * 브라우저 Sentry가 같은 사이트의 /api/monitoring으로 보낸 묶음을 Sentry로 넘깁니다.
 * CSP의 connect-src 'self'를 넓히지 않아도 되고, 광고 차단기에도 덜 막힙니다.
 * 묶음 머리글의 DSN이 이 사이트의 DSN과 같을 때만 넘겨, 다른 프로젝트로 보내는 중계로 쓰이지 않게 합니다.
 */
export async function POST(request: Request): Promise<Response> {
  const target = parseDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);
  if (!target) return new Response(null, { status: 404 });
  if (!limiter.take(clientKey(request.headers))) return new Response(null, { status: 429 });

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_ENVELOPE_BYTES) return new Response(null, { status: 413 });
  const body = await request.text().catch(() => null);
  if (body === null || body.length > MAX_ENVELOPE_BYTES) return new Response(null, { status: 413 });

  const newline = body.indexOf("\n");
  let header: { dsn?: unknown } | null = null;
  try {
    header = JSON.parse(newline === -1 ? body : body.slice(0, newline)) as { dsn?: unknown };
  } catch {
    // 아래에서 거절합니다.
  }
  const sent = parseDsn(typeof header?.dsn === "string" ? header.dsn : null);
  if (!sent || sent.host !== target.host || sent.projectId !== target.projectId) {
    return new Response(null, { status: 400 });
  }

  try {
    const upstream = await fetch(target.envelopeUrl, {
      method: "POST",
      headers: { "content-type": "application/x-sentry-envelope" },
      body,
      signal: AbortSignal.timeout(5000),
    });
    return new Response(null, { status: upstream.status });
  } catch {
    return new Response(null, { status: 502 });
  }
}
