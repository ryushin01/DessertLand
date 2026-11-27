"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  CATEGORY_LABELS,
  getProduct,
  useProductTexts,
  formatCurrency,
} from "@/entities/admin-catalog";
import {
  STATUS_LABELS,
  dashboardStats,
  useAdminOrders,
  type DashboardStats,
} from "@/entities/admin-order";
import {
  Eyebrow,
  Pill,
  SlashList,
  SlashMark,
  SlashName,
  SplitTitle,
  TextLink,
  kit,
} from "@/shared/ui/admin-kit";

import styles from "./Dashboard.module.css";

// 좁은 칸에서도 한 줄에 들어가도록 "$1,234" 꼴로 씁니다(어드민 집계는 모두 달러 환산).
const usd = (value: number) => formatCurrency(value, "USD", "en-US");
const dayLabel = (time: number) =>
  new Intl.DateTimeFormat("ko", { month: "numeric", day: "numeric" }).format(time);

/** 날짜별 순매출 막대(한 계열). 가리키면 그날 값을, 표로 보기에서 전체 값을 보여 줍니다. */
function RevenueChart({ daily }: { daily: DashboardStats["daily"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 960;
  const height = 280;
  const top = 16;
  const bottom = 28;
  const max = Math.max(1, ...daily.map((item) => item.revenueUsd));
  // 눈금은 보기 좋은 단위(50·100·200·500…)로 올립니다.
  const step = [50, 100, 200, 250, 500, 1000, 2000].find((value) => max / value <= 4) ?? 5000;
  const ceiling = Math.ceil(max / step) * step;
  const slot = width / daily.length;
  // 얇은 막대: 칸의 38%(최대 28), 막대 사이가 넉넉히 비게 합니다.
  const barWidth = Math.min(28, Math.max(4, slot * 0.38));
  const y = (value: number) => top + (height - top - bottom) * (1 - value / ceiling);
  const hovered = hover === null ? null : daily[hover];
  const best = daily.reduce(
    (a, b) => (b.revenueUsd > a.revenueUsd ? b : a),
    daily[0] ?? { day: 0, revenueUsd: 0, orders: 0 },
  );

  return (
    <figure className={styles.section}>
      <div className={styles.chart}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`지난 ${daily.length}일 날짜별 순매출 막대그래프. 가장 많은 날은 ${dayLabel(best.day)} ${usd(best.revenueUsd)}입니다. 아래 '표로 보기'에서 모든 값을 볼 수 있습니다.`}
        >
          {Array.from({ length: ceiling / step + 1 }, (_, index) => index * step).map((tick) => (
            <g key={tick}>
              <line
                x1={0}
                x2={width}
                y1={y(tick)}
                y2={y(tick)}
                className={tick === 0 ? styles.baseline : styles.grid}
              />
              <text x={width} y={y(tick) - 6} textAnchor="end" className={styles.axis}>
                {usd(tick)}
              </text>
            </g>
          ))}
          {daily.map((item, index) => {
            const x = index * slot + (slot - barWidth) / 2;
            const barTop = y(item.revenueUsd);
            const barHeight = Math.max(0, y(0) - barTop);
            return (
              <g key={item.day} className={styles.barGroup}>
                {barHeight > 0 ? (
                  <path
                    className={styles.bar}
                    d={`M${x},${y(0)} V${barTop + 2} q0,-2 2,-2 H${x + barWidth - 2} q2,0 2,2 V${y(0)} Z`}
                  />
                ) : null}
                {index % 2 === 0 || daily.length <= 7 ? (
                  <text
                    x={x + barWidth / 2}
                    y={height - 8}
                    textAnchor="middle"
                    className={styles.axis}
                  >
                    {dayLabel(item.day)}
                  </text>
                ) : null}
                {/* 막대보다 넓은 가리키기 영역 */}
                <rect
                  className={styles.chartHit}
                  x={index * slot}
                  y={top}
                  width={slot}
                  height={height - top - bottom}
                  onPointerEnter={() => setHover(index)}
                  onPointerLeave={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>
        {hovered && hover !== null ? (
          <div
            className={styles.tooltip}
            aria-hidden="true"
            style={{
              left: `${((hover + 0.5) / daily.length) * 100}%`,
              top: `${(y(hovered.revenueUsd) / height) * 100}%`,
            }}
          >
            {dayLabel(hovered.day)} · {usd(hovered.revenueUsd)} · 주문 {hovered.orders}건
          </div>
        ) : null}
      </div>
      <details className={styles.details}>
        <summary>표로 보기</summary>
        <div className={kit.tableWrap}>
          <table className={kit.table}>
            <caption>날짜별 순매출(달러 환산, 취소·환불 제외)</caption>
            <thead>
              <tr>
                <th scope="col">날짜</th>
                <th scope="col" className={kit.num}>
                  순매출
                </th>
                <th scope="col" className={kit.num}>
                  주문
                </th>
              </tr>
            </thead>
            <tbody>
              {daily.map((item) => (
                <tr key={item.day}>
                  <th scope="row">{dayLabel(item.day)}</th>
                  <td className={kit.num}>{usd(item.revenueUsd)}</td>
                  <td className={kit.num}>{item.orders}건</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

/** 대시보드: 지난 14일 매출·주문·환불, 날짜별 매출, 인기 상품, 분류별 판매, 처리 대기 주문. */
export function DashboardView() {
  const { orders, ready, now, sync } = useAdminOrders();
  const names = useProductTexts("ko");
  // 기준 시각은 저장소를 읽은 시각입니다. 서버 렌더링 결과와 어긋나지 않게 읽기 전에는 그리지 않습니다.
  // 서버(공개 데모는 MSW 워커)에서 주문을 받아 온 뒤에 계산합니다. 받지 못하면 이 브라우저의 기록으로 계산합니다.
  const stats = useMemo(
    () => (ready && sync !== "pending" ? dashboardStats(orders, now) : null),
    [orders, ready, now, sync],
  );
  const [focused, setFocused] = useState<string | null>(null);
  const name = (slug: string) => names?.[slug]?.name ?? slug;
  const waiting = orders.filter((order) => order.status === "paid").slice(0, 5);

  return (
    <>
      <SplitTitle eyebrow="Dashboard · 14 days" title="대시보드" />
      {stats ? (
        <>
          <section aria-labelledby="kpi-title" className={styles.section}>
            <h2 id="kpi-title" className={kit.srOnly}>
              지난 14일 요약
            </h2>
            <dl className={styles.kpis}>
              {[
                ["Revenue", "순매출", usd(stats.revenueUsd), "달러 환산, 취소·환불 제외"],
                ["Orders", "주문", `${stats.orders}건`, "취소 제외"],
                ["Average", "평균 주문액", usd(stats.averageUsd), "순매출 ÷ 주문"],
                ["Refunds", "환불액", usd(stats.refundsUsd), "같은 기간 주문의 환불"],
                ["Waiting", "처리 대기", `${stats.pending}건`, "결제 완료·준비 중"],
              ].map(([eyebrow, label, value, note]) => (
                <div key={eyebrow} className={styles.kpi}>
                  <dt>
                    <Eyebrow>{eyebrow}</Eyebrow>
                    <span className={kit.srOnly}>{label}</span>
                  </dt>
                  <dd className={styles.kpiValue}>{value}</dd>
                  <dd className={styles.kpiNote}>
                    {label} · {note}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="revenue-title" className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 id="revenue-title" className={styles.sectionTitle}>
                날짜별 순매출 <SlashMark />
              </h2>
              <Eyebrow>Daily revenue · USD</Eyebrow>
            </div>
            <RevenueChart daily={stats.daily} />
          </section>

          <section aria-labelledby="top-title" className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 id="top-title" className={styles.sectionTitle}>
                인기 상품 <SlashMark />
              </h2>
              <Eyebrow>Best sellers · quantity</Eyebrow>
            </div>
            {/* 원본 첫 화면: 작은 대문자 라벨 + 큰 세리프 이름 / 원형 배지, 오른쪽 사진은 가리킨 상품으로 바뀜 */}
            <div className={styles.collection}>
              <div>
                <p className={styles.collectionLabel}>
                  <Eyebrow>Collection</Eyebrow>
                  <span className={styles.logotype}>Best sellers</span>
                </p>
                <SlashList label="인기 상품 순위">
                  {stats.top.map((item, index) => {
                    const product = getProduct(item.slug);
                    const category = product ? CATEGORY_LABELS[product.category] : "";
                    return (
                      <li key={item.slug} className={styles.collectionItem}>
                        <Link
                          href={`/admin/products/${item.slug}`}
                          className={styles.collectionName}
                          onPointerEnter={() => setFocused(item.slug)}
                          onFocus={() => setFocused(item.slug)}
                        >
                          <SlashName
                            order={index}
                            badge={
                              category ? { short: category.slice(0, 1), long: category } : undefined
                            }
                            srText={`${index + 1}위, ${category}`}
                          >
                            {name(item.slug)}
                          </SlashName>
                        </Link>
                        <span className={styles.collectionMeta}>
                          <Pill tone={index === 0 ? "solid" : "outline"}>{item.quantity}개</Pill>
                          {usd(item.revenueUsd)}
                        </span>
                      </li>
                    );
                  })}
                </SlashList>
              </div>
              <div className={styles.collectionPhoto} aria-hidden="true">
                {stats.top.map((item) => {
                  const product = getProduct(item.slug);
                  return product ? (
                    <Image
                      key={item.slug}
                      unoptimized
                      src={product.image.src}
                      alt=""
                      width={500}
                      height={700}
                      data-visible={(focused ?? stats.top[0]?.slug) === item.slug}
                    />
                  ) : null;
                })}
              </div>
            </div>
          </section>

          <div className={styles.twoCols}>
            <section aria-labelledby="category-title" className={styles.section}>
              <h2 id="category-title" className={styles.sectionTitle}>
                분류별 판매 <SlashMark />
              </h2>
              <div className={kit.tableWrap}>
                <table className={kit.table}>
                  <caption>지난 14일 판매 수량(취소·전액 환불 제외)</caption>
                  <thead>
                    <tr>
                      <th scope="col">분류</th>
                      <th scope="col" className={kit.num}>
                        수량
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.categories.map((item) => (
                      <tr key={item.category}>
                        <th scope="row">{CATEGORY_LABELS[item.category]}</th>
                        <td className={kit.num}>{item.quantity}개</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section aria-labelledby="waiting-title" className={styles.section}>
              <h2 id="waiting-title" className={styles.sectionTitle}>
                처리할 주문 <SlashMark />
              </h2>
              <div className={kit.tableWrap}>
                <table className={kit.table}>
                  <caption>결제 완료 상태로 기다리는 최근 주문</caption>
                  <thead>
                    <tr>
                      <th scope="col">주문</th>
                      <th scope="col">상태</th>
                      <th scope="col" className={kit.num}>
                        금액
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {waiting.map((order) => (
                      <tr key={order.id}>
                        <th scope="row">
                          <Link href={`/admin/orders/${encodeURIComponent(order.id)}`}>
                            {order.orderNo}
                          </Link>
                        </th>
                        <td>
                          <Pill>{STATUS_LABELS[order.status]}</Pill>
                        </td>
                        <td className={kit.num}>
                          {formatCurrency(order.total, order.currency, "ko")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TextLink href="/admin/orders">주문 전체 보기</TextLink>
            </section>
          </div>

          <section aria-labelledby="next-title" className={styles.inverse}>
            <Eyebrow>Next</Eyebrow>
            <h2 id="next-title" className={styles.inverseTitle}>
              오늘의 진열대
            </h2>
            <div className={styles.inverseLinks}>
              <TextLink href="/admin/products">상품 고치기</TextLink>
              <TextLink href="/admin/tastes">맛·성분 정리</TextLink>
              <TextLink href="/admin/recommendations">AI 추천 기록</TextLink>
            </div>
          </section>
        </>
      ) : (
        <p role="status">주문 기록을 읽는 중입니다…</p>
      )}
    </>
  );
}
