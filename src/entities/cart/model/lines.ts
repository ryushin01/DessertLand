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
