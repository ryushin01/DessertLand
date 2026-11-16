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

  // Content-Length가 없거나 틀려도 상한을 넘기 전에 읽기를 멈추도록, 바이트 수를 세며 읽습니다.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_ENVELOPE_BYTES) return new Response(null, { status: 413 });
  const body = await readLimited(request, MAX_ENVELOPE_BYTES);
  if (body === "too-large") return new Response(null, { status: 413 });
  if (body === null) return new Response(null, { status: 400 });

  const newline = body.indexOf(0x0a);
  let header: { dsn?: unknown } | null = null;
  try {
    const firstLine = new TextDecoder().decode(newline === -1 ? body : body.subarray(0, newline));
    header = JSON.parse(firstLine) as { dsn?: unknown };
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

/** 본문을 바이트 상한까지만 읽습니다. 넘으면 읽기를 멈추고 "too-large", 읽지 못하면 null입니다. */
async function readLimited(
  request: Request,
  limit: number,
): Promise<Uint8Array<ArrayBuffer> | "too-large" | null> {
  if (!request.body) return new Uint8Array(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel().catch(() => undefined);
        return "too-large";
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}
