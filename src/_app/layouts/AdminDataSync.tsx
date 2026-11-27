"use client";

import { useEffect } from "react";

import { syncAdminOrders } from "@/entities/admin-order";
import { DEMO_MODE } from "@/shared/config";

/**
 * 어드민 화면을 열면 주문을 서버에서 받아 옵니다. 공개 데모 빌드는 먼저 MSW 워커(/admin/ 범위)를 띄워
 * 시드 주문·데모 환불을 워커가 응답하게 합니다. 워커는 이 경로에서만 지연 로딩하므로 쇼핑몰 번들에는 실리지 않습니다.
 */
export function AdminDataSync() {
  useEffect(() => {
    void (async () => {
      if (DEMO_MODE) {
        const { startAdminDemoWorker } = await import("@/_app/mocks/browser");
        await startAdminDemoWorker();
      }
      await syncAdminOrders();
    })();
  }, []);
  return null;
}
