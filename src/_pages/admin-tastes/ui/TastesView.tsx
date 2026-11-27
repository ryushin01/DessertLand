"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import {
  ALLERGENS,
  ALLERGEN_LABELS,
  NO_PRODUCT_QUERY,
  TASTES,
  TASTE_LABELS,
  buildRows,
  filterRows,
  patchOverrides,
  useCatalogStore,
  useProductTexts,
  type Allergen,
  type Taste,
} from "@/entities/admin-catalog";
import { Eyebrow, SplitTitle, TextButton, TextField, kit } from "@/shared/ui/admin-kit";

import styles from "./Tastes.module.css";

const PAGE_SIZE = 20;

/**
 * 맛·알레르기 성분 관리: 태그별 상품 수와, 상품마다 맛 6가지·성분 6가지를 바로 켜고 끄는 표.
 * 바꾸면 쇼핑몰 목록의 맛·성분 필터와 상품 상세의 성분 표시에 반영됩니다(공개 데모, 같은 브라우저).
 */
export function TastesView() {
  const { overrides, custom, ready } = useCatalogStore();
  const names = useProductTexts("ko");
  const rows = useMemo(() => buildRows(overrides, custom, names), [overrides, custom, names]);
  const [text, setText] = useState("");
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState("");
  const deferred = useDeferredValue(text);
  const visible = useMemo(
    () => filterRows(rows, { ...NO_PRODUCT_QUERY, text: deferred }),
    [rows, deferred],
  );
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const shown = visible.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const counts = useMemo(() => {
    const tastes = Object.fromEntries(
      TASTES.map((taste) => [taste, rows.filter((row) => row.tastes.includes(taste)).length]),
    );
    const allergens = Object.fromEntries(
      ALLERGENS.map((allergen) => [
        allergen,
        rows.filter((row) => row.allergens.includes(allergen)).length,
      ]),
    );
    return { tastes, allergens, none: rows.filter((row) => row.allergens.length === 0).length };
  }, [rows]);

  const toggleTaste = (slug: string, name: string, value: Taste, on: boolean) => {
    const row = rows.find((item) => item.slug === slug);
    if (!row) return;
    patchOverrides({
      [slug]: {
        tastes: TASTES.filter((taste) => (taste === value ? on : row.tastes.includes(taste))),
      },
    });
    setMessage(`${name}: 맛 '${TASTE_LABELS[value]}'을(를) ${on ? "더했습니다" : "뺐습니다"}.`);
  };

  const toggleAllergen = (slug: string, name: string, value: Allergen, on: boolean) => {
    const row = rows.find((item) => item.slug === slug);
    if (!row) return;
    patchOverrides({
      [slug]: {
        allergens: ALLERGENS.filter((allergen) =>
          allergen === value ? on : row.allergens.includes(allergen),
        ),
      },
    });
    setMessage(
      `${name}: 성분 '${ALLERGEN_LABELS[value]}'을(를) ${on ? "더했습니다" : "뺐습니다"}.`,
    );
  };

  return (
    <>
      <SplitTitle eyebrow="Tastes & allergens" title="맛·성분" />
      <section aria-labelledby="tag-summary" className={styles.summary}>
        <h2 id="tag-summary" className={kit.srOnly}>
          태그별 상품 수
        </h2>
        <div>
          <Eyebrow as="p">Tastes</Eyebrow>
          <ul className={styles.tags}>
            {TASTES.map((taste) => (
              <li key={taste}>
                <span>{TASTE_LABELS[taste]}</span>
                <span className={styles.tagCount}>{counts.tastes[taste]}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Eyebrow as="p">Allergens</Eyebrow>
          <ul className={styles.tags}>
            {ALLERGENS.map((allergen) => (
              <li key={allergen}>
                <span>{ALLERGEN_LABELS[allergen]}</span>
                <span className={styles.tagCount}>{counts.allergens[allergen]}</span>
              </li>
            ))}
            <li>
              <span>표시할 성분 없음</span>
              <span className={styles.tagCount}>{counts.none}</span>
            </li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="tag-matrix" className={styles.matrix}>
        <h2 id="tag-matrix" className={styles.title}>
          상품별로 지정하기
        </h2>
        <div className={styles.search}>
          <TextField
            label="이름·slug로 찾기"
            type="search"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setPage(0);
            }}
          />
        </div>
        <p role="status" className={styles.message}>
          {ready ? message || `${visible.length}개 상품` : "상품을 읽는 중입니다…"}
        </p>
        <div className={kit.tableWrap}>
          <table className={`${kit.table} ${styles.table}`}>
            <caption>
              체크하면 바로 저장됩니다 · {current + 1} / {pages}쪽
            </caption>
            <thead>
              <tr>
                <th scope="col">상품</th>
                {TASTES.map((taste) => (
                  <th key={taste} scope="col" className={styles.tagHead}>
                    {TASTE_LABELS[taste]}
                  </th>
                ))}
                {ALLERGENS.map((allergen) => (
                  <th key={allergen} scope="col" className={styles.tagHead}>
                    {ALLERGEN_LABELS[allergen]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.slug}>
                  <th scope="row">
                    <Link href={`/admin/products/${row.slug}`}>{row.name}</Link>
                  </th>
                  {TASTES.map((taste) => (
                    <td key={taste} className={styles.cell}>
                      <input
                        type="checkbox"
                        aria-label={`${row.name} 맛: ${TASTE_LABELS[taste]}`}
                        checked={row.tastes.includes(taste)}
                        onChange={(event) =>
                          toggleTaste(row.slug, row.name, taste, event.target.checked)
                        }
                      />
                    </td>
                  ))}
                  {ALLERGENS.map((allergen) => (
                    <td key={allergen} className={styles.cell}>
                      <input
                        type="checkbox"
                        aria-label={`${row.name} 성분: ${ALLERGEN_LABELS[allergen]}`}
                        checked={row.allergens.includes(allergen)}
                        onChange={(event) =>
                          toggleAllergen(row.slug, row.name, allergen, event.target.checked)
                        }
                      />
                    </td>
                  ))}
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
