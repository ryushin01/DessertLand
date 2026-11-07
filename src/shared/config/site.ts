/** 도메인을 연결하면 NEXT_PUBLIC_SITE_URL만 바꾸면 됩니다. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dessert-land-three.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "Dessert Land";
