type LogoProps = { className?: string; size?: number };

/** 케이크 언덕 꼭대기에 깃발을 꽂은 디저트 랜드 로고입니다. 이름은 부모 요소에서 제공합니다. */
export function Logo({ className, size = 36 }: LogoProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M24 19V6" stroke="#f7ecdf" strokeWidth="2" strokeLinecap="round" />
      <path d="M25 6l10 4-10 4z" fill="#ff6484" />
      <path d="M5 39c3-13 10-21 19-21s16 8 19 21z" fill="#f2b267" />
      <path
        d="M11.5 26.5C15 21 19.5 18 24 18s9 3 12.500 8.500c-1 2.700-4 2.700-5-.2-1 4-5.500 4-6.500.2-1 3-5 3-6-.2-1 3.200-6.500 3.200-7.500.2z"
        fill="#f7ecdf"
      />
      <rect x="3" y="39" width="42" height="3.500" rx="1.750" fill="#f7ecdf" />
    </svg>
  );
}
