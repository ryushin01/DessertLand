import type { ButtonHTMLAttributes } from "react";

import { buttonRecipe } from "./button-recipe";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "solid" | "outline";
  size?: "md" | "sm";
};

export function Button({ tone, size, className, type = "button", ...rest }: ButtonProps) {
  const recipe = buttonRecipe({ tone, size });
  return <button type={type} className={className ? `${recipe} ${className}` : recipe} {...rest} />;
}
