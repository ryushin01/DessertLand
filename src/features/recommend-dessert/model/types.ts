import type { Allergen } from "@/entities/product";

export const TASTE_CHIPS = [
  "fruity",
  "chocolate",
  "coffee",
  "nutty",
  "creamy",
  "light",
  "nutFree",
] as const;
export type TasteChip = (typeof TASTE_CHIPS)[number];

export const MAX_QUERY_LENGTH = 200;
export const MAX_PICKS = 3;

export type RecommendRequest = {
  query: string;
  chips: TasteChip[];
  locale: string;
};

export type Pick = { slug: string; reason: string };
export type Recommendation = { intro: string; picks: Pick[] };

/** 응답 본문은 한 줄에 JSON 하나씩 보냅니다. */
export type RecommendEvent =
  | ({ type: "update" } & Recommendation)
  | ({ type: "done"; source: "ai" | "basic" } & Recommendation)
  | { type: "error" };

export type RawRecommendation = {
  intro?: unknown;
  excludedAllergens?: unknown;
  picks?: unknown;
};

export const ALLERGENS: Allergen[] = ["milk", "egg", "wheat", "nuts", "soy", "sesame"];
