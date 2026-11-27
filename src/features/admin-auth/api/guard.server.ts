import "server-only";

import type { NextRequest } from "next/server";

import { ADMIN_COOKIE, isValidSession } from "../model/session";
import { adminAuthConfig } from "./config.server";

/** 어드민 API가 요청마다 확인합니다. proxy가 화면을 막아도 API는 따로 확인합니다. */
export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  return isValidSession(request.cookies.get(ADMIN_COOKIE)?.value, adminAuthConfig(), Date.now());
}

/** 실제 인증(데모 아님)으로 들어온 요청인지. Stripe 주문 읽기·환불은 이 경우에만 합니다. */
export async function isRealAdminRequest(request: NextRequest): Promise<boolean> {
  const config = adminAuthConfig();
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  return (
    token !== undefined && token !== "demo" && (await isValidSession(token, config, Date.now()))
  );
}
