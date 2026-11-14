import { describe, expect, it } from "vitest";

import { validateCheckout } from "./validate";

describe("validateCheckout", () => {
  it("빈 값을 찾습니다", () => {
    expect(validateCheckout({ name: " ", email: "", address: "" })).toEqual({
      name: "required",
      email: "required",
      address: "required",
    });
  });

  it("이메일 형식을 확인합니다", () => {
    expect(validateCheckout({ name: "a", email: "nope", address: "b" })).toEqual({
      email: "emailInvalid",
    });
    expect(validateCheckout({ name: "a", email: "a@example.com", address: "b" })).toEqual({});
  });
});
