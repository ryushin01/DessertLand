export const CATEGORIES = [
  "milkshake",
  "cheesecake",
  "muffin",
  "pancake",
  "creamcake",
  "classic",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type Allergen = "milk" | "egg" | "wheat" | "nuts";

export type PhotoCredit = { name: string; username: string; photoUrl: string };

export type Product = {
  slug: string;
  category: Category;
  /** ISO 3166-1 국가 코드. 국가 이름은 Intl.DisplayNames로 언어별로 표시합니다. */
  country: string;
  coordinates: string;
  priceUsd: number;
  weightGrams: number;
  allergens: Allergen[];
  image: { src: string; width: number; height: number };
  credit: PhotoCredit;
};

const u = (slug: string) => `https://unsplash.com/photos/${slug}`;
const img = (slug: string, width: number, height: number) => ({
  src: `/images/products/${slug}.webp`,
  width,
  height,
});

export const PRODUCTS: Product[] = [
  {
    slug: "freakshake",
    category: "milkshake",
    country: "AU",
    coordinates: "35.28°S 149.13°E",
    priceUsd: 9.5,
    weightGrams: 450,
    allergens: ["milk", "wheat", "nuts"],
    image: img("freakshake", 1500, 2187),
    credit: { name: "Clarissa Carbungco", username: "clariiidot", photoUrl: u("cream-and-chocolate-filled-mug-uy9DJw9e_vs") },
  },
  {
    slug: "vanilla-malt",
    category: "milkshake",
    country: "US",
    coordinates: "41.88°N 87.63°W",
    priceUsd: 7.5,
    weightGrams: 400,
    allergens: ["milk", "wheat"],
    image: img("vanilla-malt", 1500, 2250),
    credit: { name: "Jonathan Borba", username: "jonathanborba", photoUrl: u("full-filled-cream-glass-on-table-7TeR1A1MUpM") },
  },
  {
    slug: "new-york-cheesecake",
    category: "cheesecake",
    country: "US",
    coordinates: "40.71°N 74.00°W",
    priceUsd: 8.5,
    weightGrams: 160,
    allergens: ["milk", "egg", "wheat"],
    image: img("new-york-cheesecake", 1500, 1000),
    credit: { name: "Tina Guina", username: "kittinskie", photoUrl: u("sliced-of-cake-on-black-plate-s8_7AqkzCWY") },
  },
  {
    slug: "basque-cheesecake",
    category: "cheesecake",
    country: "ES",
    coordinates: "43.32°N 1.98°W",
    priceUsd: 9,
    weightGrams: 170,
    allergens: ["milk", "egg", "wheat"],
    image: img("basque-cheesecake", 1500, 1053),
    credit: { name: "mahyar mirghasemi", username: "mahyar_mirghasmi", photoUrl: u("a-piece-of-cheesecake-on-a-green-plate-z35wEXJ8kvA") },
  },
  {
    slug: "blueberry-muffin",
    category: "muffin",
    country: "US",
    coordinates: "44.31°N 69.78°W",
    priceUsd: 4.5,
    weightGrams: 110,
    allergens: ["milk", "egg", "wheat"],
    image: img("blueberry-muffin", 1500, 1875),
    credit: { name: "Elena Taranukhina", username: "elena_yt", photoUrl: u("a-black-plate-topped-with-three-blueberry-muffins-G8SrS1ewVXM") },
  },
  {
    slug: "bran-muffin",
    category: "muffin",
    country: "CA",
    coordinates: "45.42°N 75.70°W",
    priceUsd: 4,
    weightGrams: 105,
    allergens: ["milk", "egg", "wheat"],
    image: img("bran-muffin", 1500, 2258),
    credit: { name: "Alina Karpenko", username: "alinasagirova", photoUrl: u("baked-muffin-on-beige-surface-d8GDJalt_BE") },
  },
  {
    slug: "maple-pancake",
    category: "pancake",
    country: "CA",
    coordinates: "46.81°N 71.21°W",
    priceUsd: 11,
    weightGrams: 280,
    allergens: ["milk", "egg", "wheat"],
    image: img("maple-pancake", 1500, 1000),
    credit: { name: "Luke Pennystan", username: "lukepennystan", photoUrl: u("pancakes-on-palte-09FcOqmi8R0") },
  },
  {
    slug: "forest-berry-pancake",
    category: "pancake",
    country: "SE",
    coordinates: "59.33°N 18.07°E",
    priceUsd: 12,
    weightGrams: 300,
    allergens: ["milk", "egg", "wheat"],
    image: img("forest-berry-pancake", 1500, 2250),
    credit: { name: "Stavros Papadimitriou", username: "stevep93", photoUrl: u("a-stack-of-pancakes-with-syrup-and-berries-on-a-plate-UBvMCte4IIo") },
  },
  {
    slug: "strawberry-shortcake",
    category: "creamcake",
    country: "JP",
    coordinates: "35.68°N 139.69°E",
    priceUsd: 8,
    weightGrams: 130,
    allergens: ["milk", "egg", "wheat"],
    image: img("strawberry-shortcake", 1500, 2000),
    credit: { name: "Vicky Ng", username: "vickyng", photoUrl: u("white-and-red-strawberry-cake--qQlfYB7pqM") },
  },
  {
    slug: "saeng-cream-cake",
    category: "creamcake",
    country: "KR",
    coordinates: "37.57°N 126.98°E",
    priceUsd: 6.5,
    weightGrams: 120,
    allergens: ["milk", "egg", "wheat"],
    image: img("saeng-cream-cake", 1500, 1000),
    credit: { name: "Takuya Nagaoka", username: "takuya_n", photoUrl: u("white-and-red-strawberry-cake-fENvSZUzbzU") },
  },
  {
    slug: "fraisier",
    category: "creamcake",
    country: "FR",
    coordinates: "48.86°N 2.35°E",
    priceUsd: 10,
    weightGrams: 150,
    allergens: ["milk", "egg", "wheat", "nuts"],
    image: img("fraisier", 1500, 1039),
    credit: { name: "amirali mirhashemian", username: "amir_v_ali", photoUrl: u("strawberry-cake-on-white-surface-cZFU60dKB6U") },
  },
  {
    slug: "tiramisu",
    category: "classic",
    country: "IT",
    coordinates: "45.67°N 12.24°E",
    priceUsd: 9,
    weightGrams: 180,
    allergens: ["milk", "egg", "wheat"],
    image: img("tiramisu", 1500, 2250),
    credit: { name: "mediha ekici", username: "mediha32", photoUrl: u("a-delicious-tiramisu-dessert-in-a-glass-dish-v5m_Dm7BQ_c") },
  },
  {
    slug: "pastel-de-nata",
    category: "classic",
    country: "PT",
    coordinates: "38.70°N 9.21°W",
    priceUsd: 3.5,
    weightGrams: 70,
    allergens: ["milk", "egg", "wheat"],
    image: img("pastel-de-nata", 1500, 1000),
    credit: { name: "Nick Fewings", username: "jannerboy62", photoUrl: u("brown-cupcakes-on-silver-tray-odX7I9pFFTU") },
  },
  {
    slug: "baklava",
    category: "classic",
    country: "TR",
    coordinates: "37.07°N 37.38°E",
    priceUsd: 7,
    weightGrams: 120,
    allergens: ["milk", "wheat", "nuts"],
    image: img("baklava", 1500, 1000),
    credit: { name: "Syed F Hashemi", username: "sfhashemi", photoUrl: u("brown-and-green-bread-with-green-leaves-bGAPRnJITpQ") },
  },
  {
    slug: "black-forest-cake",
    category: "classic",
    country: "DE",
    coordinates: "48.00°N 8.20°E",
    priceUsd: 9.5,
    weightGrams: 170,
    allergens: ["milk", "egg", "wheat"],
    image: img("black-forest-cake", 1500, 1731),
    credit: { name: "Jacob Thomas", username: "jacob225", photoUrl: u("chocolate-cake-with-cherries-and-cream-6jHpcBPw7i8") },
  },
  {
    slug: "egg-tart",
    category: "classic",
    country: "CN",
    coordinates: "23.13°N 113.26°E",
    priceUsd: 3.5,
    weightGrams: 70,
    allergens: ["milk", "egg", "wheat"],
    image: img("egg-tart", 1500, 2250),
    credit: { name: "Moonyang Lin", username: "interniweeni", photoUrl: u("three-small-pies-sitting-on-top-of-a-black-plate-WdZ3qItLcjU") },
  },
];

export const HERO_CREDIT: PhotoCredit = {
  name: "Mae Mu",
  username: "picoftasty",
  photoUrl: u("person-pouring-flour-on-table-beside-eggs-and-whisk-rgRbqFweGF0"),
};

/** 카테고리별 대표 상품(홈 쇼케이스). */
export const CATEGORY_COVERS: Record<Category, string> = {
  milkshake: "freakshake",
  cheesecake: "new-york-cheesecake",
  muffin: "blueberry-muffin",
  pancake: "forest-berry-pancake",
  creamcake: "strawberry-shortcake",
  classic: "tiramisu",
};

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((product) => product.slug === slug);
}

export function getProductsByCategory(category?: Category): Product[] {
  return category ? PRODUCTS.filter((product) => product.category === category) : PRODUCTS;
}

export function isCategory(value: unknown): value is Category {
  return CATEGORIES.includes(value as Category);
}
