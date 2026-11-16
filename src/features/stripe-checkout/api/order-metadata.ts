/**
 * 이 사이트가 만든 결제 세션 표시. Stripe 샌드박스를 다른 프로젝트와 함께 쓰므로,
 * 결제 확인과 주문 조회는 이 표시가 있는 세션만 받습니다.
 */
export const ORDER_APP = "dessert-land";

/** 이 사이트가 만든 세션인지 봅니다. 0.7.x까지의 세션은 app 표시 없이 source(cart·buy)만 있습니다. */
export function isOwnSession(metadata: Record<string, string> | null | undefined): boolean {
  if (!metadata) return false;
  if (metadata.app !== undefined) return metadata.app === ORDER_APP;
  return metadata.source === "cart" || metadata.source === "buy";
}

/** Stripe 메타데이터 값 하나에 담을 수 있는 최대 글자 수입니다. */
export const METADATA_VALUE_LIMIT = 500;
const KEY_PREFIX = "items_";

/**
 * 산 상품의 slug를 쉼표로 이어 메타데이터에 담습니다.
 * 500자 안이면 0.6.0까지와 같은 items 키 하나에 담아, 이전 버전으로 되돌려도 읽을 수 있게 합니다.
 * 넘으면 값 하나가 500자를 넘지 않게 items_1, items_2…로 나눕니다.
 * 한 주문은 99종까지라 slug가 가장 길어도 키 몇 개면 됩니다(Stripe 상한은 키 50개).
 */
export function packSlugs(slugs: readonly string[]): Record<string, string> {
  const joined = slugs.join(",");
  if (joined.length <= METADATA_VALUE_LIMIT) return joined ? { items: joined } : {};
  const chunks: string[] = [];
  let current = "";
  for (const slug of slugs) {
    const next = current ? `${current},${slug}` : slug;
    if (next.length > METADATA_VALUE_LIMIT && current) {
      chunks.push(current);
      current = slug;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return Object.fromEntries(chunks.map((chunk, index) => [`${KEY_PREFIX}${index + 1}`, chunk]));
}

/** packSlugs로 담은 값을 순서대로 합칩니다. items 키 하나짜리와 items_1, items_2…를 모두 읽습니다. */
export function unpackSlugs(metadata: Record<string, string> | null | undefined): string[] {
  if (!metadata) return [];
  const parts: string[] = [];
  if (metadata.items) parts.push(metadata.items);
  for (let index = 1; metadata[`${KEY_PREFIX}${index}`] !== undefined; index += 1) {
    parts.push(metadata[`${KEY_PREFIX}${index}`] as string);
  }
  return parts.flatMap((part) => part.split(",")).filter(Boolean);
}
