import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { clientKey, createRateLimiter } from "@/shared/lib/rate-limit";

import {
  ADMIN_COOKIE,
  DEMO_SESSION,
  SESSION_TTL_MS,
  createSessionToken,
  isPasswordCorrect,
} from "../model/session";
import { adminAuthConfig } from "./config.server";
import { isAdminRequest } from "./guard.server";

const limiter = createRateLimiter(10, 60_000);

const bodySchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("demo") }),
  z.object({ mode: z.literal("password"), password: z.string().min(1).max(200) }),
]);

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

/** 지금 어드민 세션인지와 쓸 수 있는 들어가는 방법(데모·비밀번호). 로그인 화면이 읽습니다. */
export async function GET(request: NextRequest) {
  const config = adminAuthConfig();
  return NextResponse.json({
    signedIn: await isAdminRequest(request),
    demo: config.demo,
    passwordEnabled: config.password !== undefined,
  });
}

/** 들어가기: 공개 데모는 "관리자로 둘러보기", 그 밖에는 ADMIN_PASSWORD 비밀번호. */
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ status: "invalid" }, { status: 400 });
  // 비밀번호 맞히기를 막는 제한이라 비밀번호 들어가기에만 셉니다(공개 데모 입장은 비밀값이 없어 세지 않음).
  if (parsed.data.mode === "password" && !limiter.take(clientKey(request.headers))) {
    return NextResponse.json({ status: "limited" }, { status: 429 });
  }
  const config = adminAuthConfig();
  let token: string | null = null;
  if (parsed.data.mode === "demo") {
    if (!config.demo) return NextResponse.json({ status: "disabled" }, { status: 403 });
    token = DEMO_SESSION;
  } else {
    if (!config.password) return NextResponse.json({ status: "disabled" }, { status: 503 });
    if (!(await isPasswordCorrect(parsed.data.password, config.password))) {
      return NextResponse.json({ status: "wrong" }, { status: 401 });
    }
    token = await createSessionToken(config.password, Date.now());
  }
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(ADMIN_COOKIE, token, cookieOptions(SESSION_TTL_MS / 1000));
  return response;
}

/** 나가기 */
export function DELETE() {
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(ADMIN_COOKIE, "", cookieOptions(0));
  return response;
}
