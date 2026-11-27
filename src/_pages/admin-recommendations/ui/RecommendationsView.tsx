"use client";

import Link from "next/link";
import { useMemo } from "react";

import { CHIP_LABELS, useProductTexts } from "@/entities/admin-catalog";
import { useRecommendationRecords } from "@/entities/recommendation-log";
import { DEMO_MODE } from "@/shared/config";
import { Eyebrow, Pill, SplitTitle, kit } from "@/shared/ui/admin-kit";

import styles from "./Recommendations.module.css";

const dateTime = (time: number) =>
  new Intl.DateTimeFormat("ko", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(time);

/** 이 브라우저의 쇼핑몰에서 받은 추천 기록 + (공개 데모) 시드 기록. 고객이 쓴 문장은 남기지 않습니다. */
export function RecommendationsView() {
  const snapshot = useRecommendationRecords(DEMO_MODE);
  const records = snapshot?.records ?? null;
  const names = useProductTexts("ko");

  const summary = useMemo(() => {
    if (!records) return null;
    const ai = records.filter((record) => record.source === "ai").length;
    const counts = new Map<string, number>();
    for (const record of records)
      for (const slug of record.picks) counts.set(slug, (counts.get(slug) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { ai, basic: records.length - ai, top };
  }, [records]);

  const name = (slug: string) => names?.[slug]?.name ?? slug;

  return (
    <>
      <SplitTitle eyebrow="AI recommendations" title="AI 추천 기록" />
      <p className={kit.notice}>
        쇼핑몰 홈의 &lsquo;디저트 추천&rsquo;에서 받은 결과입니다. 고객이 쓴 문장은 어디에도 남기지
        않고, 고른 맛 조건·추천 상품·출처만 이 브라우저에 남깁니다(서버 로그 없음). 공개 데모에는
        Claude API 키가 없어 대부분 규칙 기반 기본 추천입니다.
      </p>
      {records && summary ? (
        <>
          <section aria-labelledby="rec-summary" className={styles.summary}>
            <h2 id="rec-summary" className={kit.srOnly}>
              요약
            </h2>
            <dl className={styles.kpis}>
              <div>
                <dt>
                  <Eyebrow>Total</Eyebrow> 전체
                </dt>
                <dd>{records.length}건</dd>
              </div>
              <div>
                <dt>
                  <Eyebrow>Claude</Eyebrow> AI 추천
                </dt>
                <dd>{summary.ai}건</dd>
              </div>
              <div>
                <dt>
                  <Eyebrow>Fallback</Eyebrow> 기본 추천
                </dt>
                <dd>{summary.basic}건</dd>
              </div>
            </dl>
            <div>
              <h3 className={styles.subTitle}>자주 추천한 상품</h3>
              <ol className={styles.top}>
                {summary.top.map(([slug, count]) => (
                  <li key={slug}>
                    <Link href={`/admin/products/${slug}`}>{name(slug)}</Link>{" "}
                    <span className={kit.mute}>{count}회</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
          <section aria-labelledby="rec-list" className={styles.list}>
            <h2 id="rec-list" className={styles.subTitle}>
              기록
            </h2>
            <div className={kit.tableWrap}>
              <table className={kit.table}>
                <caption>최신 기록부터 · 이 브라우저 기록 {snapshot?.local ?? 0}건</caption>
                <thead>
                  <tr>
                    <th scope="col">일시</th>
                    <th scope="col">언어</th>
                    <th scope="col">고른 맛</th>
                    <th scope="col">문장</th>
                    <th scope="col">출처</th>
                    <th scope="col">추천 상품</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => (
                    <tr key={`${record.at}-${index}`}>
                      <th scope="row">{dateTime(record.at)}</th>
                      <td>{record.locale}</td>
                      <td>
                        {record.chips.map((chip) => CHIP_LABELS[chip] ?? chip).join(", ") || "—"}
                      </td>
                      <td>{record.withQuery ? "씀(내용은 남기지 않음)" : "안 씀"}</td>
                      <td>
                        <Pill tone={record.source === "ai" ? "solid" : "outline"}>
                          {record.source === "ai" ? "Claude" : "기본 추천"}
                        </Pill>
                      </td>
                      <td>{record.picks.map(name).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <p role="status">기록을 읽는 중입니다…</p>
      )}
    </>
  );
}
