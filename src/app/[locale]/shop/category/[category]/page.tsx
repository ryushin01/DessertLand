export {
  ShopCategoryPage as default,
  generateCategoryMetadata as generateMetadata,
  generateCategoryStaticParams as generateStaticParams,
} from "@/_pages/shop";

// 분류는 정해져 있으므로 미리 만든 것 밖의 주소는 404입니다.
export const dynamicParams = false;
