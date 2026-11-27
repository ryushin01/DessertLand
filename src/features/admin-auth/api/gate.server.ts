import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE, isValidSession } from "../model/session";
import { adminAuthConfig } from "./config.server";

export const isAdminPath = (pathname: string) =>
  pathname === "/admin" || pathname.startsWith("/admin/");

/**
 * proxy가 어드민 화면 요청마다 부릅니다. 세션이 없으면 들어가기 화면(/admin/login)으로 보내고,
 * 들어온 뒤에 들어가기 화면을 열면 대시보드로 보냅니다. 화면은 언어 주소(/ko 등)로 보내지 않습니다.
 */
export async function adminGate(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const signedIn = await isValidSession(
    request.cookies.get(ADMIN_COOKIE)?.value,
    adminAuthConfig(),
    Date.now(),
  );
  const isLogin = pathname === "/admin/login";
  if (isLogin && signedIn) return NextResponse.redirect(new URL("/admin", request.url));
  if (!isLogin && !signedIn) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
