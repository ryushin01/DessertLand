export type CheckoutData = { name: string; email: string; address: string };
export type CheckoutErrors = Partial<Record<keyof CheckoutData, "required" | "emailInvalid">>;

export function validateCheckout(data: CheckoutData): CheckoutErrors {
  const errors: CheckoutErrors = {};
  if (!data.name.trim()) errors.name = "required";
  if (!data.address.trim()) errors.address = "required";
  if (!data.email.trim()) errors.email = "required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = "emailInvalid";
  return errors;
}

/** 데모 주문입니다. 입력값은 어디에도 전송하지 않습니다. */
export async function placeDemoOrder(data: CheckoutData): Promise<string> {
  void data;
  await new Promise((resolve) => setTimeout(resolve, 600));
  return `DW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
