import { setupWorker } from "msw/browser";

import { adminDemoHandlers } from "./handlers/admin";

/**
 * 어드민 공개 데모·오프라인용 Service Worker. 워커 파일은 public/admin/mockServiceWorker.js이고 범위는 /admin/이라
 * 쇼핑몰 화면에는 붙지 않습니다(같은 출처라 CSP worker-src 'self'로 허용). 데모 빌드의 어드민 화면에서만 지연 로딩합니다.
 */
let started: Promise<unknown> | null = null;

export function startAdminDemoWorker(): Promise<unknown> {
  started ??= setupWorker(...adminDemoHandlers)
    .start({
      serviceWorker: { url: "/admin/mockServiceWorker.js", options: { scope: "/admin/" } },
      onUnhandledFrame: "bypass",
      quiet: true,
    })
    // 서비스 워커를 쓸 수 없는 환경(사생활 보호 모드 등)이면 실제 서버 응답을 씁니다.
    .catch(() => undefined);
  return started;
}
