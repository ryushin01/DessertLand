export type CheckoutData = { name: string; email: string; address: string };
/** 오류 문구의 메시지 키. 무엇이 잘못됐는지와 고치는 방법을 함께 적습니다. */
export type CheckoutError = "nameRequired" | "emailRequired" | "addressRequired" | "emailInvalid";
export type CheckoutErrors = Partial<Record<keyof CheckoutData, CheckoutError>>;

export function validateCheckout(data: CheckoutData): CheckoutErrors {
  const errors: CheckoutErrors = {};
  if (!data.name.trim()) errors.name = "nameRequired";
  if (!data.address.trim()) errors.address = "addressRequired";
  if (!data.email.trim()) errors.email = "emailRequired";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = "emailInvalid";
  return errors;
}
