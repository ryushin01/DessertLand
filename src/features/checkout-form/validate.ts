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
