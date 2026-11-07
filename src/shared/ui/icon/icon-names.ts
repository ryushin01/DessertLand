export const ICON_NAMES = [
  "shopping-bag",
  "cross",
  "plus",
  "minus",
  "arrow-right",
  "arrow-down",
  "arrow-up-right",
  "globe",
  "pause",
  "play",
  "trash",
  "check",
  "marker",
] as const;

export type IconName = (typeof ICON_NAMES)[number];
