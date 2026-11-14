export type CartLine = { slug: string; quantity: number };

export const MAX_QUANTITY = 20;

const clamp = (quantity: number) => Math.min(MAX_QUANTITY, Math.max(0, Math.trunc(quantity)));

export function addLine(lines: CartLine[], slug: string, quantity = 1): CartLine[] {
  const existing = lines.find((line) => line.slug === slug);
  if (!existing) return [...lines, { slug, quantity: Math.max(1, clamp(quantity)) }];
  return lines.map((line) =>
    line.slug === slug ? { ...line, quantity: clamp(line.quantity + quantity) } : line,
  );
}

export function setLineQuantity(lines: CartLine[], slug: string, quantity: number): CartLine[] {
  const next = clamp(quantity);
  if (next === 0) return removeLine(lines, slug);
  return lines.map((line) => (line.slug === slug ? { ...line, quantity: next } : line));
}

export function removeLine(lines: CartLine[], slug: string): CartLine[] {
  return lines.filter((line) => line.slug !== slug);
}

export function countItems(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** 주문에서 뺀 상품(excluded)을 제외한, 주문할 줄만 돌려줍니다. 새로 담은 상품은 처음부터 주문에 들어갑니다. */
export function selectLines(lines: CartLine[], excluded: readonly string[]): CartLine[] {
  return lines.filter((line) => !excluded.includes(line.slug));
}

/** 결제한 상품만 장바구니에서 뺍니다. 고르지 않은 상품은 그대로 남깁니다. */
export function removePurchased(lines: CartLine[], purchased: readonly string[]): CartLine[] {
  return lines.filter((line) => !purchased.includes(line.slug));
}
