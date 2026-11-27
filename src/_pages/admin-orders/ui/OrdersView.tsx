"use client";

import Link from "next/link";
import { formatCurrency } from "@/entities/admin-catalog";
import { useDeferredValue, useMemo, useState } from "react";

import {
  ORDER_STATUSES,
  STATUS_LABELS,
  useAdminOrders,
  type AdminOrder,
  type OrderStatus,
} from "@/entities/admin-order";
import { Pill, SelectField, SplitTitle, TextButton, TextField, kit } from "@/shared/ui/admin-kit";

import styles from "./Orders.module.css";

const PAGE_SIZE = 25;
const dateTime = (time: number) =>
  new Intl.DateTimeFormat("ko", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(time);

/** 주문 목록: 번호·고객·상품 찾기, 상태·결제 방식 거르기, 25건씩. */
export function OrdersView() {
  const { orders, ready, sync } = useAdminOrders();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [channel, setChannel] = useState<AdminOrder["channel"] | "">("");
  const [page, setPage] = useState(0);
  const deferredText = useDeferredValue(text);

  const counts = useMemo(() => {
    const result: Partial<Record<OrderStatus, number>> = {};
    for (const order of orders) result[order.status] = (result[order.status] ?? 0) + 1;
    return result;
  }, [orders]);

  const visible = useMemo(() => {
    const query = deferredText.trim().toLowerCase();
    return orders.filter(
      (order) =>
        (!status || order.status === status) &&
        (!channel || order.channel === channel) &&
        (!query ||
          order.orderNo.toLowerCase().includes(query) ||
          order.customer.toLowerCase().includes(query) ||
          order.items.some((item) => item.slug.includes(query))),
    );
  }, [orders, status, channel, deferredText]);
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const shown = visible.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  return (
    <>
      <SplitTitle eyebrow={`Orders · ${orders.length}`} title="주문" />
      <section aria-labelledby="orders-title" className={styles.section}>
        <h2 id="orders-title" className={kit.srOnly}>
          주문 목록
        </h2>
        <div className={styles.filters} role="search" aria-label="주문 찾기">
          <TextField
            label="주문 번호·고객·상품 slug로 찾기"
            type="search"
            value={text}
            placeholder="예: DL-5A, 고객 #12, tiramisu"
            onChange={(event) => {
              setText(event.target.value);
              setPage(0);
            }}
          />
          <SelectField
            label="결제 방식"
            value={channel}
            onChange={(event) => {
              const value = event.target.value;
              setChannel(value === "stripe" || value === "test" ? value : "");
              setPage(0);
            }}
          >
            <option value="">전체</option>
            <option value="stripe">Stripe(테스트 모드)</option>
            <option value="test">내장 테스트 결제</option>
          </SelectField>
        </div>
        <div className={styles.statusTabs} role="group" aria-label="상태로 거르기">
          <button type="button" aria-pressed={status === ""} onClick={() => setStatus("")}>
            전체 {orders.length}
          </button>
          {ORDER_STATUSES.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={status === item}
              onClick={() => {
                setStatus(item);
                setPage(0);
              }}
            >
              {STATUS_LABELS[item]} {counts[item] ?? 0}
            </button>
          ))}
        </div>
        <p role="status">
          {ready ? `${visible.length}건` : "주문을 읽는 중입니다…"}
          {sync === "pending" ? " · 주문을 받아 오는 중" : ""}
          {sync === "failed" ? " · 주문을 받아 오지 못했습니다(이 브라우저의 기록만 보입니다)" : ""}
        </p>
        <div className={kit.tableWrap}>
          <table className={kit.table}>
            <caption>
              최신 주문부터 · {current + 1} / {pages}쪽 · 고객은 개인정보 없이 익명 번호로만 표시
            </caption>
            <thead>
              <tr>
                <th scope="col">주문</th>
                <th scope="col">일시</th>
                <th scope="col">고객</th>
                <th scope="col" className={kit.num}>
                  상품
                </th>
                <th scope="col" className={kit.num}>
                  금액
                </th>
                <th scope="col">결제</th>
                <th scope="col">상태</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((order) => (
                <tr key={order.id}>
                  <th scope="row">
                    <Link href={`/admin/orders/${encodeURIComponent(order.id)}`}>
                      {order.orderNo}
                    </Link>
                    {order.origin === "browser" ? (
                      <span className={styles.sub}>이 브라우저의 쇼핑몰 주문</span>
                    ) : null}
                  </th>
                  <td>{dateTime(order.createdAt)}</td>
                  <td>{order.customer}</td>
                  <td className={kit.num}>
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}개
                  </td>
                  <td className={kit.num}>{formatCurrency(order.total, order.currency, "ko")}</td>
                  <td>{order.channel === "stripe" ? "Stripe" : "테스트"}</td>
                  <td>
                    <Pill
                      tone={
                        order.status === "paid"
                          ? "solid"
                          : order.status === "cancelled" || order.status === "refunded"
                            ? "dashed"
                            : "outline"
                      }
                    >
                      {STATUS_LABELS[order.status]}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <nav aria-label="쪽 이동" className={styles.pager}>
          <TextButton disabled={current === 0} onClick={() => setPage(current - 1)}>
            이전 쪽
          </TextButton>
          <span>
            {current + 1} / {pages}
          </span>
          <TextButton disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
            다음 쪽
          </TextButton>
        </nav>
      </section>
    </>
  );
}
