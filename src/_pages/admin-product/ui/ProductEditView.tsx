"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import {
  ADMIN_LOCALES,
  ALLERGENS,
  ALLERGEN_LABELS,
  CATEGORY_LABELS,
  LOCALE_LABELS,
  TASTES,
  TASTE_LABELS,
  buildRows,
  countryLabel,
  fieldErrors,
  loadProductTexts,
  productFormSchema,
  saveOverride,
  useCatalogStore,
  type AdminLocale,
  type Allergen,
  type Taste,
  formatCurrency,
} from "@/entities/admin-catalog";
import {
  ChipGroup,
  PillButton,
  SplitTitle,
  TextArea,
  TextButton,
  TextField,
  TextLink,
  cx,
  kit,
} from "@/shared/ui/admin-kit";

import styles from "./Product.module.css";

type Texts = Partial<Record<AdminLocale, { name: string; description: string }>>;

type Draft = {
  priceUsd: string;
  discount: string;
  stock: string;
  hidden: boolean;
  name: Partial<Record<AdminLocale, string>>;
  description: Partial<Record<AdminLocale, string>>;
  allergens: Allergen[];
  tastes: Taste[];
};

const usd = (value: number) => formatCurrency(value, "USD", "ko");

/** 10개 언어의 원래 이름·설명(메시지 파일). 새 상품은 원문이 없어 빈 문자열입니다. */
function useOriginalTexts(slug: string): Texts | null {
  const [texts, setTexts] = useState<{ slug: string; value: Texts } | null>(null);
  useEffect(() => {
    let alive = true;
    void Promise.all(ADMIN_LOCALES.map((locale) => loadProductTexts(locale))).then((all) => {
      if (!alive) return;
      const value: Texts = {};
      ADMIN_LOCALES.forEach((locale, index) => {
        value[locale] = all[index]?.[slug] ?? { name: "", description: "" };
      });
      setTexts({ slug, value });
    });
    return () => {
      alive = false;
    };
  }, [slug]);
  return texts?.slug === slug ? texts.value : null;
}

/** 입력칸 이름(오류 키) → 칸 id. 첫 오류 칸으로 초점을 옮길 때 씁니다. */
const fieldId = (key: string) => `product-${key.replace(/\./g, "-")}`;

/** 상품 수정: 가격·할인·재고·숨김, 10개 언어 이름·설명, 맛·알레르기 성분. 저장하면 같은 브라우저의 쇼핑몰에 반영됩니다. */
export function ProductEditView({ slug }: { slug: string }) {
  const { overrides, custom, ready } = useCatalogStore();
  const originals = useOriginalTexts(slug);
  const row = useMemo(
    () => buildRows(overrides, custom, null).find((item) => item.slug === slug),
    [overrides, custom, slug],
  );
  const override = overrides[slug];
  // 수정값을 덧씌우기 전의 원래 행(성분·맛이 원래와 같으면 저장하지 않으려고)
  const original = useMemo(
    () => buildRows({}, custom, null).find((item) => item.slug === slug),
    [custom, slug],
  );
  // 고치기 전 값은 저장소·원문에서 계산하고, 고친 뒤에는 edits가 폼 값입니다(원래 값으로 되돌리면 다시 null).
  const initial = useMemo<Draft | null>(() => {
    if (!ready || !originals || !row) return null;
    return {
      priceUsd: String(row.priceUsd),
      discount: String(row.discount),
      stock: row.stock === null ? "" : String(row.stock),
      hidden: override?.hidden ?? false,
      name: Object.fromEntries(
        ADMIN_LOCALES.map((locale) => [
          locale,
          override?.name?.[locale] || originals[locale]?.name || "",
        ]),
      ),
      description: Object.fromEntries(
        ADMIN_LOCALES.map((locale) => [
          locale,
          override?.description?.[locale] || originals[locale]?.description || "",
        ]),
      ),
      allergens: row.allergens,
      tastes: row.tastes,
    };
  }, [ready, originals, row, override]);
  const [edits, setEdits] = useState<Draft | null>(null);
  const draft = edits ?? initial;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (ready && !row) {
    return (
      <>
        <SplitTitle eyebrow="Product" title="상품을 찾을 수 없습니다" />
        <TextLink href="/admin/products">상품 목록으로</TextLink>
      </>
    );
  }

  const title = draft?.name.ko || row?.name || slug;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || !originals || !row) return;
    const parsed = productFormSchema.safeParse(draft);
    if (!parsed.success) {
      const next = fieldErrors(parsed.error);
      setErrors(next);
      setStatus({ text: `고칠 칸이 ${Object.keys(next).length}개 있습니다.`, error: true });
      const first = Object.keys(next)[0];
      // 접힌 언어 칸이면 펼친 뒤 초점을 옮깁니다.
      const element = first ? document.getElementById(fieldId(first)) : null;
      element?.closest("details")?.setAttribute("open", "");
      element?.focus();
      return;
    }
    const data = parsed.data;
    // 원문과 같은 문구는 저장하지 않아, 쇼핑몰이 메시지 파일의 원문을 그대로 씁니다.
    const changed = (values: Partial<Record<AdminLocale, string>>, field: "name" | "description") =>
      Object.fromEntries(
        ADMIN_LOCALES.flatMap((locale) => {
          const value = values[locale] ?? "";
          return value && value !== (originals[locale]?.[field] ?? "") ? [[locale, value]] : [];
        }),
      );
    saveOverride(slug, {
      hidden: data.hidden,
      priceUsd: data.priceUsd === row.basePriceUsd ? undefined : data.priceUsd,
      discount: data.discount || undefined,
      stock: data.stock === "" ? undefined : Number(data.stock),
      name: nonEmpty(changed(data.name, "name")),
      description: nonEmpty(changed(data.description, "description")),
      allergens: same(data.allergens, original?.allergens ?? []) ? undefined : data.allergens,
      tastes: same(data.tastes, original?.tastes ?? []) ? undefined : data.tastes,
    });
    setErrors({});
    setStatus({
      text: row.custom
        ? "저장했습니다. 새 상품은 어드민에만 보입니다."
        : "저장했습니다. 같은 브라우저의 쇼핑몰에 바로 반영됩니다.",
      error: false,
    });
  };

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    if (draft) setEdits({ ...draft, [key]: value });
    setStatus(null);
  };

  const setText = (field: "name" | "description", locale: AdminLocale, value: string) => {
    if (draft) setEdits({ ...draft, [field]: { ...draft[field], [locale]: value } });
  };

  return (
    <>
      <SplitTitle
        eyebrow={`Product · ${slug}`}
        title={title}
        crumbs={[{ label: "상품", href: "/admin/products" }, { label: "수정" }]}
      />
      <div className={styles.layout}>
        <aside className={styles.aside} aria-label="상품 요약">
          <div className={styles.photo}>
            {row?.image ? (
              <Image unoptimized src={row.image} alt={title} width={500} height={700} priority />
            ) : (
              <p className={styles.photoEmpty}>사진 없음(새 상품)</p>
            )}
          </div>
          {row ? (
            <dl className={styles.facts}>
              <div>
                <dt>분류</dt>
                <dd>{CATEGORY_LABELS[row.category]}</dd>
              </div>
              <div>
                <dt>나라</dt>
                <dd>{countryLabel(row.country)}</dd>
              </div>
              <div>
                <dt>판매가</dt>
                <dd>
                  {usd(row.salePriceUsd)}
                  {row.discount > 0 ? ` (정가 ${usd(row.priceUsd)}, ${row.discount}% 할인)` : ""}
                </dd>
              </div>
              <div>
                <dt>쇼핑몰</dt>
                <dd>
                  {row.custom ? (
                    "새 상품은 어드민에만 있습니다"
                  ) : (
                    <a href={`/ko/shop/${slug}`} target="_blank" rel="noopener">
                      쇼핑몰에서 보기(새 탭)
                    </a>
                  )}
                </dd>
              </div>
            </dl>
          ) : null}
        </aside>

        {draft ? (
          <form
            ref={formRef}
            className={styles.form}
            onSubmit={submit}
            noValidate
            aria-label={`${title} 수정`}
          >
            <section className={styles.group} aria-labelledby="price-title">
              <h2 id="price-title" className={styles.groupTitle}>
                가격·재고
              </h2>
              <div className={styles.row}>
                <TextField
                  id={fieldId("priceUsd")}
                  label="정가(달러)"
                  inputMode="decimal"
                  value={draft.priceUsd}
                  error={errors.priceUsd}
                  hint={row ? `원래 ${usd(row.basePriceUsd)}` : undefined}
                  onChange={(event) => set("priceUsd", event.target.value)}
                />
                <TextField
                  id={fieldId("discount")}
                  label="할인율(%)"
                  inputMode="numeric"
                  value={draft.discount}
                  error={errors.discount}
                  hint="0~90"
                  onChange={(event) => set("discount", event.target.value)}
                />
                <TextField
                  id={fieldId("stock")}
                  label="재고(개)"
                  inputMode="numeric"
                  value={draft.stock}
                  error={errors.stock}
                  hint="비우면 제한 없음, 0이면 품절"
                  onChange={(event) => set("stock", event.target.value)}
                />
              </div>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={draft.hidden || Boolean(row?.custom)}
                  disabled={row?.custom}
                  onChange={(event) => set("hidden", event.target.checked)}
                />
                쇼핑몰에서 숨기기{row?.custom ? "(새 상품은 늘 숨김)" : ""}
              </label>
            </section>

            <section className={styles.group} aria-labelledby="text-title">
              <h2 id="text-title" className={styles.groupTitle}>
                이름·설명 — 10개 언어
              </h2>
              <div>
                {ADMIN_LOCALES.map((locale) => (
                  <details key={locale} className={styles.locale} open={locale === "ko"}>
                    <summary lang="ko">
                      <span>
                        {LOCALE_LABELS[locale]} <span className={kit.mute}>{locale}</span>
                      </span>
                    </summary>
                    <div className={styles.localeBody}>
                      <TextField
                        id={fieldId(`name.${locale}`)}
                        label={`이름(${LOCALE_LABELS[locale]})`}
                        lang={locale}
                        value={draft.name[locale] ?? ""}
                        error={errors[`name.${locale}`]}
                        onChange={(event) => setText("name", locale, event.target.value)}
                      />
                      <TextArea
                        id={fieldId(`description.${locale}`)}
                        label={`설명(${LOCALE_LABELS[locale]})`}
                        lang={locale}
                        value={draft.description[locale] ?? ""}
                        error={errors[`description.${locale}`]}
                        onChange={(event) => setText("description", locale, event.target.value)}
                      />
                    </div>
                  </details>
                ))}
              </div>
            </section>

            <section className={styles.group} aria-labelledby="taste-title">
              <h2 id="taste-title" className={styles.groupTitle}>
                맛·알레르기 성분
              </h2>
              <ChipGroup
                legend="맛"
                name="tastes"
                options={TASTES}
                labels={TASTE_LABELS}
                value={draft.tastes}
                onChange={(value) => set("tastes", value)}
              />
              <ChipGroup
                legend="알레르기 유발 성분"
                name="allergens"
                options={ALLERGENS}
                labels={ALLERGEN_LABELS}
                value={draft.allergens}
                onChange={(value) => set("allergens", value)}
              />
            </section>

            <div className={styles.actions}>
              <PillButton type="submit">저장</PillButton>
              <TextLink href="/admin/products">목록으로</TextLink>
              <TextButton
                onClick={() => {
                  saveOverride(slug, row?.custom ? { name: override?.name } : {});
                  setEdits(null);
                  setErrors({});
                  setStatus({ text: "원래 값으로 되돌렸습니다.", error: false });
                }}
              >
                원래 값으로
              </TextButton>
            </div>
            <p role="status" className={cx(styles.status, status?.error && styles.statusError)}>
              {status?.text}
            </p>
          </form>
        ) : (
          <p role="status">상품 정보를 읽는 중입니다…</p>
        )}
      </div>
    </>
  );
}

const nonEmpty = <T extends object>(value: T): T | undefined =>
  Object.keys(value).length > 0 ? value : undefined;

const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((item) => b.includes(item));
