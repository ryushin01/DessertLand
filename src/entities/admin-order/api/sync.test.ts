import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { server } from "@/_app/mocks/node";

import { useAdminOrders } from "../model/store";
import { syncAdminOrders } from "./sync";

describe("어드민 주문 받아 오기", () => {
  beforeEach(() => localStorage.clear());

  it("공개 데모의 시드 주문(MSW 어드민 목업)을 받아 더합니다", async () => {
    const { result } = renderHook(() => useAdminOrders());
    await syncAdminOrders();
    await waitFor(() => expect(result.current.sync).toBe("synced"));
    expect(result.current.orders).toHaveLength(72);
  });

  it("이미 처리한 주문은 다시 받아도 덮어쓰지 않습니다", async () => {
    const { result } = renderHook(() => useAdminOrders());
    await syncAdminOrders();
    const first = result.current.orders[0];
    expect(first).toBeDefined();
    await syncAdminOrders();
    await waitFor(() => expect(result.current.orders).toHaveLength(72));
  });

  it("받지 못하면(권한 없음) 이 브라우저의 기록만 보이고 실패로 표시합니다", async () => {
    server.use(
      http.get("/api/admin/orders", () =>
        HttpResponse.json({ status: "forbidden" }, { status: 403 }),
      ),
    );
    const { result } = renderHook(() => useAdminOrders());
    await syncAdminOrders();
    await waitFor(() => expect(result.current.sync).toBe("failed"));
    expect(result.current.orders).toEqual([]);
  });
});
