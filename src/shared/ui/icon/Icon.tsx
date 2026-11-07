import "./uicons-subset.css";

import type { IconName } from "./icon-names";

type IconProps = { name: IconName; className?: string };

/** Flaticon UIcons. 장식용이므로 이름은 부모 요소에서 제공합니다. */
export function Icon({ name, className }: IconProps) {
  return <i aria-hidden="true" className={`fi fi-${name}${className ? ` ${className}` : ""}`} />;
}
