import { SITE_NAME, SITE_URL } from "@/shared/config";

type ProductJsonLdInput = {
  slug: string;
  locale: string;
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
};

/**
 * 상품 상세의 구조화 데이터(schema.org Product·Offer). 검색 결과에 이름·사진·가격이 나오게 합니다.
 * 화면에 보이는 값과 같은 이름·설명·가격(그 언어의 통화)을 씁니다.
 * script 안에 넣으므로 "<"를 이스케이프해 태그가 닫히지 않게 합니다.
 */
export function productJsonLd({
  slug,
  locale,
  name,
  description,
  image,
  price,
  currency,
}: ProductJsonLdInput): string {
  const url = `${SITE_URL}/${locale}/shop/${slug}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: [`${SITE_URL}${image}`],
    sku: slug,
    url,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url,
      price,
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
