import { loadHttp } from "@/shared/api";

import { importOrders, setSyncState } from "../model/store";
import { adminOrderSchema } from "../model/types";

/**
 * 주문을 서버에서 받아 이 브라우저의 어드민 주문에 더합니다(이미 처리한 주문은 그대로).
 * - 공개 데모: 어드민 화면의 MSW 워커가 시드 주문으로 응답합니다(_app/mocks/handlers/admin.ts).
 * - 실제 운영: 서버가 Stripe 테스트 모드 세션을 읽어 돌려줍니다(실제 인증만).
 * 받지 못하면(오프라인·권한 없음) 이 브라우저에 남은 주문만 보입니다.
 */
export async function syncAdminOrders(): Promise<void> {
  setSyncState("pending");
  try {
    const { http } = await loadHttp();
    const result: unknown = await http.url("/api/admin/orders").get().json();
    const orders =
      typeof result === "object" &&
      result !== null &&
      "orders" in result &&
      Array.isArray(result.orders)
        ? result.orders.flatMap((order: unknown) => {
            const parsed = adminOrderSchema.safeParse(order);
            return parsed.success ? [parsed.data] : [];
          })
        : [];
    importOrders(orders);
    setSyncState("synced");
  } catch {
    setSyncState("failed");
  }
}
