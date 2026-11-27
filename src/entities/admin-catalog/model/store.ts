"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";

import {
  OVERRIDES_KEY,
  parseCatalogOverrides,
  type CatalogOverrides,
  type ProductOverride,
} from "@/entities/product/@x/admin-catalog";

import { customProductSchema, type CustomProduct } from "./schema";

/** 어드민에서 새로 추가한 상품(이 브라우저). 쇼핑몰의 정적 페이지·서버 가격표에는 없어 쇼핑몰에는 보이지 않습니다. */
export const CUSTOM_PRODUCTS_KEY = "dessert-land.admin.products";

type Snapshot = { overrides: CatalogOverrides; custom: CustomProduct[]; ready: boolean };
const EMPTY: Snapshot = { overrides: {}, custom: [], ready: false };
const listeners = new Set<() => void>();
let cache: { key: string; value: Snapshot } | null = null;

const readRaw = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const parseJson = (raw: string | null): unknown => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

function read(): Snapshot {
  const overridesRaw = readRaw(OVERRIDES_KEY);
  const customRaw = readRaw(CUSTOM_PRODUCTS_KEY);
  const key = `${overridesRaw}\u0000${customRaw}`;
  if (cache?.key === key) return cache.value;
  const custom = z.array(customProductSchema).safeParse(parseJson(customRaw));
  const value: Snapshot = {
    overrides: parseCatalogOverrides(parseJson(overridesRaw)),
    custom: custom.success ? custom.data : [],
    ready: true,
  };
  cache = { key, value };
  return value;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

const notify = () => listeners.forEach((listener) => listener());

/** 어드민 상품 저장소(수정값 + 새 상품). 서버 렌더링 중에는 ready가 false입니다. */
export const useCatalogStore = (): Snapshot => useSyncExternalStore(subscribe, read, () => EMPTY);

/** 빈 칸(undefined)·기본값은 저장하지 않아, 쇼핑몰이 원래 값을 그대로 쓰게 합니다. */
function compact(override: ProductOverride): ProductOverride {
  return Object.fromEntries(
    Object.entries(override).filter(([, value]) => value !== undefined && value !== false),
  );
}

/** 상품 하나의 수정값을 저장합니다. 같은 브라우저의 쇼핑몰(다른 탭 포함)에 바로 반영됩니다. */
export function saveOverride(slug: string, override: ProductOverride) {
  const overrides = { ...read().overrides };
  const next = compact(override);
  if (Object.keys(next).length === 0) delete overrides[slug];
  else overrides[slug] = next;
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  notify();
}

/** 여러 상품의 수정값 일부(예: 맛·성분)를 한꺼번에 바꿉니다. */
export function patchOverrides(patches: Record<string, Partial<ProductOverride>>) {
  const overrides = { ...read().overrides };
  for (const [slug, patch] of Object.entries(patches)) {
    const next = compact({ ...overrides[slug], ...patch });
    if (Object.keys(next).length === 0) delete overrides[slug];
    else overrides[slug] = next;
  }
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  notify();
}

export function addCustomProduct(product: CustomProduct) {
  localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify([...read().custom, product]));
  notify();
}

/** 데모 데이터 초기화: 상품 수정값과 새 상품을 지웁니다. */
export function resetCatalog() {
  localStorage.removeItem(OVERRIDES_KEY);
  localStorage.removeItem(CUSTOM_PRODUCTS_KEY);
  cache = null;
  notify();
}
