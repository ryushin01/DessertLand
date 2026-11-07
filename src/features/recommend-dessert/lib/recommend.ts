import { PRODUCTS, getProduct, type Allergen, type Product } from "@/entities/product";

import {
  ALLERGENS,
  MAX_PICKS,
  MAX_QUERY_LENGTH,
  TASTE_CHIPS,
  type Pick,
  type RawRecommendation,
  type RecommendRequest,
  type Recommendation,
  type TasteChip,
} from "../model/types";

const TASTES: Record<string, TasteChip[]> = {
  freakshake: ["chocolate", "creamy"],
  "vanilla-malt": ["creamy", "chocolate"],
  "new-york-cheesecake": ["creamy"],
  "basque-cheesecake": ["creamy"],
  "blueberry-muffin": ["fruity", "light"],
  "bran-muffin": ["light"],
  "maple-pancake": [],
  "forest-berry-pancake": ["fruity"],
  "strawberry-shortcake": ["fruity", "creamy", "light"],
  "saeng-cream-cake": ["creamy", "light"],
  fraisier: ["fruity", "creamy"],
  tiramisu: ["coffee", "creamy", "chocolate"],
  "pastel-de-nata": ["creamy"],
  baklava: ["nutty"],
  "black-forest-cake": ["chocolate", "fruity"],
  "egg-tart": ["light"],
};

export function isRecommendRequest(body: unknown): body is RecommendRequest {
  const request = body as Partial<RecommendRequest> | null;
  return (
    typeof request?.query === "string" &&
    request.query.length <= MAX_QUERY_LENGTH &&
    Array.isArray(request.chips) &&
    request.chips.length <= TASTE_CHIPS.length &&
    request.chips.every((chip) => TASTE_CHIPS.includes(chip)) &&
    typeof request.locale === "string" &&
    (request.query.trim().length > 0 || request.chips.length > 0)
  );
}

/** 모델의 응답을 믿지 않고, 있는 상품과 지켜야 할 알레르기 조건만 남깁니다. */
export function sanitizeRecommendation(
  raw: RawRecommendation | null,
  requiredExclusions: Allergen[] = [],
): Recommendation {
  const intro = typeof raw?.intro === "string" ? raw.intro : "";
  const modelExclusions = Array.isArray(raw?.excludedAllergens)
    ? ALLERGENS.filter((allergen) => (raw.excludedAllergens as unknown[]).includes(allergen))
    : [];
  const excluded = new Set<Allergen>([...requiredExclusions, ...modelExclusions]);
  const seen = new Set<string>();
  const picks: Pick[] = [];
  for (const candidate of Array.isArray(raw?.picks) ? raw.picks : []) {
    const { slug, reason } = (candidate ?? {}) as { slug?: unknown; reason?: unknown };
    if (typeof slug !== "string" || seen.has(slug)) continue;
    const product = getProduct(slug);
    if (!product || product.allergens.some((allergen) => excluded.has(allergen))) continue;
    seen.add(slug);
    picks.push({ slug, reason: typeof reason === "string" ? reason : "" });
    if (picks.length === MAX_PICKS) break;
  }
  return { intro, picks };
}

export function requiredExclusions(chips: TasteChip[]): Allergen[] {
  return chips.includes("nutFree") ? ["nuts"] : [];
}

type LocalWords = {
  productName: (slug: string) => string;
  productDescription: (slug: string) => string;
  categoryName: (product: Product) => string;
  allergenName: (allergen: Allergen) => string;
};

/** API 키가 없거나 호출에 실패할 때 쓰는 규칙 기반 추천입니다. 알레르기 단어가 있으면 안전하게 뺍니다. */
export function recommendLocally(
  { query, chips }: Pick_<RecommendRequest, "query" | "chips">,
  words: LocalWords,
): Pick[] {
  const text = query.toLocaleLowerCase();
  const excluded = new Set<Allergen>(requiredExclusions(chips));
  for (const allergen of ALLERGENS) {
    const name = words.allergenName(allergen).toLocaleLowerCase();
    if (name && text.includes(name)) excluded.add(allergen);
  }
  const scored = PRODUCTS.filter(
    (product) => !product.allergens.some((allergen) => excluded.has(allergen)),
  ).map((product, index) => {
    const tastes = TASTES[product.slug] ?? [];
    let score = chips.filter((chip) => tastes.includes(chip)).length * 2;
    if (text && text.includes(words.productName(product.slug).toLocaleLowerCase())) score += 5;
    if (text && text.includes(words.categoryName(product).toLocaleLowerCase())) score += 3;
    return { product, score, index };
  });
  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, MAX_PICKS)
    .map(({ product }) => ({
      slug: product.slug,
      reason: words.productDescription(product.slug),
    }));
}

type Pick_<T, K extends keyof T> = { [P in K]: T[P] };
