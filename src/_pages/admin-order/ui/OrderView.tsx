"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";

import { useProductTexts, formatCurrency } from "@/entities/admin-catalog";
import {
  NEXT_STATUSES,
  STATUS_LABELS,
  applyRefund,
  changeStatus,
  refundableAmount,
  refundedAmount,
  saveOrder,
  useAdminOrders,
  type AdminOrder,
} from "@/entities/admin-order";
import {
  Modal,
  Pill,
  PillButton,
  SplitTitle,
  TextArea,
  TextButton,
  TextField,
  TextLink,
  cx,
  kit,
} from "@/shared/ui/admin-kit";

import { requestRefund } from "../api/refund";
import styles from "./Order.module.css";

const dateTime = (time: number) =>
  new Intl.DateTimeFormat("ko", { dateStyle: "medium", timeStyle: "short" }).format(time);

type RefundDialogProps = {
  order: AdminOrder;
  open: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
};

/** 환불 대화상자: 금액(남은 금액 이하)과 사유. 오류 칸에 aria-invalid·설명을 잇고 그 칸으로 초점을 옮깁니다. */
function RefundDialog({ order, open, onClose, onDone }: RefundDialogProps) {
  const remaining = refundableAmount(order);
  const [amount, setAmount] = useState(String(remaining));
  const [reason, setReason] = useState("고객 요청");
  const [errors, setErrors] = useState<{ amount?: string; reason?: string; form?: string }>({});
  const [pending, setPending] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const money = (value: number) => formatCurrency(value, order.currency, "ko");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(amount.replace(/,/g, ""));
    const next: typeof errors = {};
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
      next.amount = "환불 금액을 0보다 큰 숫자로 입력해 주세요.";
    } else if (value > remaining) {
      next.amount = `남은 금액(${money(remaining)})보다 많이 돌려줄 수 없습니다.`;
    }
    if (!reason.trim()) next.reason = "환불 사유를 적어 주세요.";
    else if (reason.length > 200) next.reason = "사유는 200자 이하로 적어 주세요.";
    setErrors(next);
    if (next.amount) return amountRef.current?.focus();
    if (next.reason) return reasonRef.current?.focus();
    setPending(true);
    const record = await requestRefund(order, value, reason.trim());
    setPending(false);
    if (record === "failed") {
      setErrors({
        form: "Stripe 환불에 실패했습니다. 잠시 뒤 다시 시도해 주세요. 돈은 돌려주지 않았습니다.",
      });
      return;
    }
    const updated = applyRefund(order, record);
    if (typeof updated === "string") {
      setErrors({ amount: "이 주문은 더 환불할 수 없습니다." });
      return amountRef.current?.focus();
    }
    saveOrder(updated);
    onDone(
      `${money(value)}을 환불했습니다(${record.method === "stripe" ? "Stripe 테스트 모드" : "내장 테스트 결제 기록"}).`,
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={`${order.orderNo} 환불`}>
      <form className={styles.refundForm} onSubmit={submit} noValidate>
        <p>
          남은 금액 {money(remaining)} ·{" "}
          {order.channel === "stripe" && order.origin !== "seed"
            ? "Stripe 테스트 모드 환불 API로 처리합니다."
            : "실제 결제가 없는 주문이라 내장 테스트 결제 기록으로 처리합니다."}
        </p>
        <TextField
          ref={amountRef}
          label={`환불 금액(${order.currency})`}
          inputMode="decimal"
          value={amount}
          error={errors.amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <TextArea
          ref={reasonRef}
          label="환불 사유"
          value={reason}
          error={errors.reason}
          hint="고객 이름·연락처 같은 개인정보는 적지 않습니다."
          onChange={(event) => setReason(event.target.value)}
        />
        {errors.form ? <p role="alert">{errors.form}</p> : null}
        <div className={styles.dialogActions}>
          <PillButton type="submit" disabled={pending}>
            {pending ? "환불하는 중…" : "환불하기"}
          </PillButton>
          <TextButton onClick={onClose}>취소</TextButton>
        </div>
      </form>
    </Modal>
  );
}

/** 주문 상세: 상품·금액, 처리 단계 바꾸기, 환불, 처리 기록. */
export function OrderView({ id }: { id: string }) {
  const { orders, ready } = useAdminOrders();
  const names = useProductTexts("ko");
  const order = orders.find((item) => item.id === id);
  const [refundOpen, setRefundOpen] = useState(false);
  // 열 때마다 새 대화상자(입력값 초기화). 닫을 때는 그대로 두어 <dialog>가 닫히며 트리거로 초점을 돌려줍니다.
  const [refundKey, setRefundKey] = useState(0);
  const [message, setMessage] = useState("");

  if (!ready) return <p role="status">주문을 읽는 중입니다…</p>;
  if (!order) {
    return (
      <>
        <SplitTitle eyebrow="Order" title="주문을 찾을 수 없습니다" />
        <TextLink href="/admin/orders">주문 목록으로</TextLink>
      </>
    );
  }

  const money = (value: number) => formatCurrency(value, order.currency, "ko");
  const refunded = refundedAmount(order);
  const remaining = refundableAmount(order);

  return (
    <>
      <SplitTitle
        eyebrow={`Order · ${STATUS_LABELS[order.status]}`}
        title={order.orderNo}
        korean={false}
        crumbs={[{ label: "주문", href: "/admin/orders" }, { label: "상세" }]}
      />
      <div className={styles.layout}>
        <dl className={styles.facts} aria-label="주문 정보">
          <div>
            <dt>상태</dt>
            <dd>
              <Pill tone="solid">{STATUS_LABELS[order.status]}</Pill>
            </dd>
          </div>
          <div>
            <dt>주문 일시</dt>
            <dd>{dateTime(order.createdAt)}</dd>
          </div>
          <div>
            <dt>고객</dt>
            <dd>{order.customer}</dd>
          </div>
          <div>
            <dt>결제</dt>
            <dd>
              {order.channel === "stripe" ? "Stripe Checkout(테스트 모드)" : "내장 테스트 결제"}
            </dd>
          </div>
          <div>
            <dt>쇼핑몰 언어</dt>
            <dd>{order.locale}</dd>
          </div>
          <div>
            <dt>환불</dt>
            <dd>{refunded > 0 ? `${money(refunded)} 환불함` : "없음"}</dd>
          </div>
        </dl>

        <div className={styles.main}>
          <section aria-labelledby="items-title" className={styles.group}>
            <h2 id="items-title" className={styles.groupTitle}>
              주문 상품
            </h2>
            <div className={kit.tableWrap}>
              <table className={kit.table}>
                <thead>
                  <tr>
                    <th scope="col">상품</th>
                    <th scope="col" className={kit.num}>
                      단가
                    </th>
                    <th scope="col" className={kit.num}>
                      수량
                    </th>
                    <th scope="col" className={kit.num}>
                      금액
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.slug}>
                      <th scope="row">
                        <Link href={`/admin/products/${item.slug}`}>
                          {names?.[item.slug]?.name ?? item.slug}
                        </Link>
                      </th>
                      <td className={kit.num}>{money(item.unitPrice)}</td>
                      <td className={kit.num}>{item.quantity}</td>
                      <td className={kit.num}>{money(item.unitPrice * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" colSpan={3}>
                      배송비
                    </th>
                    <td className={kit.num}>{money(order.shipping)}</td>
                  </tr>
                  <tr>
                    <th scope="row" colSpan={3}>
                      합계
                    </th>
                    <td className={cx(kit.num, styles.total)}>{money(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section aria-labelledby="process-title" className={styles.group}>
            <h2 id="process-title" className={styles.groupTitle}>
              처리
            </h2>
            <div className={styles.actions}>
              {NEXT_STATUSES[order.status].map((status) => (
                <PillButton
                  key={status}
                  ghost={status === "cancelled"}
                  onClick={() => {
                    const updated = changeStatus(order, status, Date.now());
                    if (typeof updated === "string") return;
                    saveOrder(updated);
                    setMessage(`상태를 '${STATUS_LABELS[status]}'(으)로 바꿨습니다.`);
                  }}
                >
                  {STATUS_LABELS[status]}(으)로 바꾸기
                </PillButton>
              ))}
              {remaining > 0 && order.status !== "refunded" ? (
                <TextButton
                  aria-haspopup="dialog"
                  onClick={() => {
                    setRefundKey((key) => key + 1);
                    setRefundOpen(true);
                  }}
                >
                  환불하기
                </TextButton>
              ) : null}
              {NEXT_STATUSES[order.status].length === 0 && remaining === 0 ? (
                <p className={kit.mute}>더 처리할 일이 없는 주문입니다.</p>
              ) : null}
            </div>
            <p role="status" className={styles.message}>
              {message}
            </p>
          </section>

          <section aria-labelledby="history-title" className={styles.group}>
            <h2 id="history-title" className={styles.groupTitle}>
              처리 기록
            </h2>
            <ol className={styles.history}>
              {order.history.map((entry, index) => (
                <li key={`${entry.status}-${index}`}>
                  <span>{STATUS_LABELS[entry.status]}</span>
                  <span className={kit.mute}>{dateTime(entry.at)}</span>
                  {entry.note ? <span className={kit.mute}>{entry.note}</span> : null}
                </li>
              ))}
              {order.refunds.map((refund) => (
                <li key={refund.id}>
                  <span>환불 {money(refund.amount)}</span>
                  <span className={kit.mute}>{dateTime(refund.at)}</span>
                  <span className={kit.mute}>
                    {refund.reason} · {refund.method === "stripe" ? "Stripe" : "테스트 기록"}
                  </span>
                </li>
              ))}
            </ol>
          </section>
          <TextLink href="/admin/orders">주문 목록으로</TextLink>
        </div>
      </div>
      <RefundDialog
        key={refundKey}
        order={order}
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        onDone={(text) => {
          setRefundOpen(false);
          setMessage(text);
        }}
      />
    </>
  );
}
