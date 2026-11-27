import styles from "./RouteSlash.module.css";

/** 화면을 옮길 때마다(경로가 키) 긴 사선을 그으며 걷히는 덮개. 장식이라 화면 읽기에서 뺍니다. */
export function RouteSlash() {
  return (
    <div className={styles.overlay} aria-hidden="true">
      <svg viewBox="0 0 49 107" preserveAspectRatio="none" focusable="false">
        <line x1="48" y1="2" x2="1" y2="105" pathLength={1} vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
