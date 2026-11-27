import "server-only";

import { DEMO_MODE } from "@/shared/config";

import type { AdminAuthConfig } from "../model/session";

/**
 * 어드민 인증 설정. ADMIN_PASSWORD는 사용자가 Vercel 환경 변수로 직접 넣는 값입니다(저장소는 만들지 않음).
 * 데모가 꺼진 빌드에서 이 값이 없으면 어드민은 잠긴 채로 둡니다.
 */
export function adminAuthConfig(): AdminAuthConfig {
  const password = process.env.ADMIN_PASSWORD;
  return { demo: DEMO_MODE, password: password && password.length >= 12 ? password : undefined };
}
