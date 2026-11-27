import styles from "./admin-kit.module.css";

/** 어드민 표·안내 등에 직접 붙이는 클래스 이름. */
export const kit = styles;

/** 클래스 이름 잇기(빈 값은 뺌). */
export const cx = (...names: (string | false | null | undefined)[]) =>
  names.filter(Boolean).join(" ");
