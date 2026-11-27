"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  CATEGORIES,
  CATEGORY_LABELS,
  COUNTRY_OPTIONS,
  addCustomProduct,
  fieldErrors,
  getProduct,
  newProductSchema,
  saveOverride,
  useCatalogStore,
} from "@/entities/admin-catalog";
import {
  PillButton,
  SelectField,
  SplitTitle,
  TextField,
  TextLink,
  kit,
} from "@/shared/ui/admin-kit";

import styles from "./Product.module.css";

const FIELDS = ["slug", "nameKo", "category", "country", "priceUsd", "weightGrams"] as const;
type Field = (typeof FIELDS)[number];

/** 상품 추가. 새 상품은 이 브라우저의 어드민에만 저장되고 쇼핑몰에는 보이지 않습니다(정적 페이지·서버 가격표에 없음). */
export function ProductCreateView() {
  const router = useRouter();
  const { custom } = useCatalogStore();
  const [values, setValues] = useState<Record<Field, string>>({
    slug: "",
    nameKo: "",
    category: "",
    country: "",
    priceUsd: "",
    weightGrams: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = newProductSchema.safeParse(values);
    const next: Partial<Record<Field, string>> = parsed.success ? {} : fieldErrors(parsed.error);
    if (
      parsed.success &&
      (getProduct(parsed.data.slug) || custom.some((item) => item.slug === parsed.data.slug))
    ) {
      next.slug = "이미 있는 slug입니다. 다른 이름을 입력해 주세요.";
    }
    const first = FIELDS.find((field) => next[field]);
    if (!parsed.success || first) {
      setErrors(next);
      if (first) document.getElementById(`new-${first}`)?.focus();
      return;
    }
    const { slug, nameKo, ...product } = parsed.data;
    addCustomProduct({ slug, ...product, createdAt: Date.now() });
    saveOverride(slug, { name: { ko: nameKo } });
    router.push(`/admin/products/${slug}`);
  };

  const bind = (field: Field) => ({
    id: `new-${field}`,
    value: values[field],
    error: errors[field],
    onChange: (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [field]: event.target.value })),
  });

  return (
    <>
      <SplitTitle
        eyebrow="New product"
        title="상품 추가"
        crumbs={[{ label: "상품", href: "/admin/products" }, { label: "추가" }]}
      />
      <p className={kit.notice}>
        새 상품은 이 브라우저의 어드민에만 저장됩니다. 쇼핑몰의 상품 페이지와 결제 가격표는 저장소의
        카탈로그로 미리 만들어 두므로, 실제로 판매하려면 <code>docs/development.md</code>의
        &lsquo;상품 추가&rsquo; 순서로 카탈로그에 더해야 합니다.
      </p>
      <form className={styles.form} onSubmit={submit} noValidate aria-label="새 상품">
        <section className={styles.group} aria-labelledby="new-basic-title">
          <h2 id="new-basic-title" className={styles.groupTitle}>
            기본 정보
          </h2>
          <div className={styles.row}>
            <TextField
              label="slug(주소 이름)"
              hint="영문 소문자·숫자·하이픈"
              autoComplete="off"
              {...bind("slug")}
            />
            <TextField label="한국어 이름" autoComplete="off" {...bind("nameKo")} />
            <SelectField label="분류" {...bind("category")}>
              <option value="">분류 고르기</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </SelectField>
            <SelectField label="나라" {...bind("country")}>
              <option value="">나라 고르기</option>
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </SelectField>
            <TextField label="정가(달러)" inputMode="decimal" {...bind("priceUsd")} />
            <TextField label="중량(g)" inputMode="numeric" {...bind("weightGrams")} />
          </div>
        </section>
        <div className={styles.actions}>
          <PillButton type="submit">추가하고 자세히 고치기</PillButton>
          <TextLink href="/admin/products">목록으로</TextLink>
        </div>
      </form>
    </>
  );
}
