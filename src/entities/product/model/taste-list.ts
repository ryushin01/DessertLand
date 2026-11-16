/** 맛 태그. AI 추천의 맛 고르기와 상품 목록의 맛 필터가 함께 씁니다. */
export const TASTES = ["fruity", "chocolate", "coffee", "nutty", "creamy", "light"] as const;
export type Taste = (typeof TASTES)[number];
