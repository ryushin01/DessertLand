"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import {
  CATEGORIES,
  CATEGORY_LABELS,
  COUNTRY_OPTIONS,
  NO_PRODUCT_QUERY,
  PRODUCT_STATE_LABELS,
  buildRows,
  countryLabel,
  filterRows,
  productState,
  useCatalogStore,
  useProductTexts,
  type ProductQuery,
  type ProductState,
  formatCurrency,
} from "@/entities/admin-catalog";
import {
  Eyebrow,
  Pill,
  PillLink,
  SelectField,
  SlashList,
  SlashName,
  SplitTitle,
  TextButton,
  TextField,
  cx,
  kit,
} from "@/shared/ui/admin-kit";

import styles from "./Products.module.css";

const PAGE_SIZE = 25;
const usd = (value: number) => formatCurrency(value, "USD", "ko");

/** 상품 목록: 이름·slug 찾기, 분류·나라·상태 거르기, 25개씩 나눠 보기. */
export function ProductsView() {
  const { overrides, custom, ready } = useCatalogStore();
  const names = useProductTexts("ko");
  const [query, setQuery] = useState<ProductQuery>(NO_PRODUCT_QUERY);
  const [page, setPage] = useState(0);
  const deferred = useDeferredValue(query);
  const rows = useMemo(() => buildRows(overrides, custom, names), [overrides, custom, names]);
  const visible = useMemo(() => filterRows(rows, deferred), [rows, deferred]);
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const shown = visible.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const countries = useMemo(
    () => COUNTRY_OPTIONS.filter((option) => rows.some((row) => row.country === option.code)),
    [rows],
  );

  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        CATEGORIES.map((category) => [
          category,
          rows.filter((row) => row.category === category).length,
        ]),
      ),
    [rows],
  );

  const update = (patch: Partial<ProductQuery>) => {
    setQuery((value) => ({ ...value, ...patch }));
    setPage(0);
  };

  return (
    <>
      <SplitTitle eyebrow={`Products · ${rows.length}`} title="상품" />
      {/* 원본 첫 화면의 작품 목록: 분류 이름 / 원형 배지(상품 수). 누르면 그 분류로 거릅니다. */}
      <section aria-labelledby="category-list-title" className={styles.categories}>
        <h2 id="category-list-title" className={styles.categoriesLabel}>
          <Eyebrow>Category</Eyebrow>
          <span className={styles.logotype}>분류로 보기</span>
        </h2>
        <SlashList className={styles.categoryList}>
          {CATEGORIES.map((category, index) => (
            <li key={category}>
              <button
                type="button"
                className={styles.categoryButton}
                aria-pressed={query.category === category}
                onClick={() => update({ category: query.category === category ? "" : category })}
              >
                <SlashName
                  order={index}
                  badge={{
                    short: String(categoryCounts[category] ?? 0),
                    long: `${categoryCounts[category] ?? 0}종`,
                  }}
                  srText={`${categoryCounts[category] ?? 0}종`}
                >
                  {CATEGORY_LABELS[category]}
                </SlashName>
              </button>
            </li>
          ))}
        </SlashList>
      </section>
      <section aria-labelledby="product-list-title" className={styles.section}>
        <h2 id="product-list-title" className={kit.srOnly}>
          상품 목록
        </h2>
        <div className={styles.filters} role="search" aria-label="상품 찾기">
          <TextField
            label="이름·slug로 찾기"
            type="search"
            value={query.text}
            placeholder="예: 티라미수, baklava"
            onChange={(event) => update({ text: event.target.value })}
          />
          <SelectField
            label="분류"
            value={query.category}
            onChange={(event) => {
              const value = CATEGORIES.find((category) => category === event.target.value);
              update({ category: value ?? "" });
            }}
          >
            <option value="">전체 분류</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="나라"
            value={query.country}
            onChange={(event) => update({ country: event.target.value })}
          >
            <option value="">전체 나라</option>
            {countries.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="상태"
            value={query.state}
            onChange={(event) => {
              const states: ProductState[] = ["onSale", "soldOut", "hidden"];
              update({ state: states.find((state) => state === event.target.value) ?? "" });
            }}
          >
            <option value="">전체 상태</option>
            {Object.entries(PRODUCT_STATE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
        </div>
        <div className={styles.toolbar}>
          <p role="status" className={styles.count}>
            {ready ? `${visible.length}개 상품` : "상품을 읽는 중입니다…"}
          </p>
          <PillLink href="/admin/products/new">상품 추가</PillLink>
        </div>
        <div className={kit.tableWrap}>
          <table className={kit.table}>
            <caption>
              {current + 1} / {pages}쪽 · 가격은 달러 기준(쇼핑몰은 언어별 통화로 바꿔 보여 줌)
            </caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className={kit.srOnly}>사진</span>
                </th>
                <th scope="col">이름</th>
                <th scope="col">분류</th>
                <th scope="col">나라</th>
                <th scope="col" className={kit.num}>
                  판매가
                </th>
                <th scope="col" className={kit.num}>
                  할인
                </th>
                <th scope="col" className={kit.num}>
                  재고
                </th>
                <th scope="col">상태</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => {
                const state = productState(row);
                return (
                  <tr key={row.slug}>
                    <td>
                      <div className={styles.thumb}>
                        {row.image ? (
                          <Image
                            unoptimized
                            src={row.image}
                            alt=""
                            width={40}
                            height={56}
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                    </td>
                    <th scope="row" className={styles.nameCell}>
                      <Link href={`/admin/products/${row.slug}`}>{row.name}</Link>
                      <span className={styles.slug}>
                        {row.slug}
                        {row.custom ? " · 새 상품" : row.edited ? " · 수정함" : ""}
                      </span>
                    </th>
                    <td>{CATEGORY_LABELS[row.category]}</td>
                    <td>{countryLabel(row.country)}</td>
                    <td className={kit.num}>
                      {row.discount > 0 ? (
                        <del className={styles.strike}>{usd(row.priceUsd)}</del>
                      ) : null}
                      {usd(row.salePriceUsd)}
                    </td>
                    <td className={cx(kit.num, row.discount === 0 && kit.mute)}>
                      {row.discount > 0 ? `${row.discount}%` : "—"}
                    </td>
                    <td className={cx(kit.num, row.stock === null && kit.mute)}>
                      {row.stock === null ? "제한 없음" : `${row.stock}개`}
                    </td>
                    <td>
                      <Pill
                        tone={
                          state === "onSale" ? "outline" : state === "soldOut" ? "solid" : "dashed"
                        }
                      >
                        {PRODUCT_STATE_LABELS[state]}
                      </Pill>
                    </td>
                  </tr>
                );
              })}
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
