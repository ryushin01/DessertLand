import {
  COUNTRY_NAMES,
  type Allergen,
  type Category,
  type Taste,
} from "@/entities/product/@x/admin-catalog";

/** 어드민은 한국어 화면입니다. 쇼핑몰 메시지 파일(ko.json)과 같은 이름을 씁니다. */
export const CATEGORY_LABELS: Record<Category, string> = {
  cake: "케이크",
  tart: "파이·타르트",
  pastry: "페이스트리",
  baked: "쿠키·구움과자",
  frozen: "아이스크림·빙수",
  pudding: "푸딩·크림",
  confection: "떡·전통 과자",
  griddle: "팬케이크·튀김",
  coffee: "커피",
  drink: "음료",
};

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  milk: "우유",
  egg: "달걀",
  wheat: "밀",
  nuts: "견과류",
  soy: "대두",
  sesame: "참깨",
};

export const TASTE_LABELS: Record<Taste, string> = {
  fruity: "상큼한 과일",
  chocolate: "진한 초콜릿",
  coffee: "커피 풍미",
  nutty: "고소한 견과",
  creamy: "부드러운 크림",
  light: "가벼운 맛",
};

/** 추천 화면의 맛 칩(맛 + 견과류 빼고). */
export const CHIP_LABELS: Record<string, string> = { ...TASTE_LABELS, nutFree: "견과류 빼고" };

const KO_COUNTRIES = COUNTRY_NAMES.ko ?? {};

export const countryLabel = (code: string) =>
  code === "XX" ? "기타" : (KO_COUNTRIES[code] ?? code);

/** 나라 고르기 목록(한국어 이름 순). */
export const COUNTRY_OPTIONS = Object.entries(KO_COUNTRIES)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name, "ko"));
