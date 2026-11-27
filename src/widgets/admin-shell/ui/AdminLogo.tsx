/**
 * 어드민 로고: 원본(이름 사이 원형 문장)의 구도를 따라 직접 그린 그림입니다. 원 안에 숟가락 두 개를 겹친 선 그림.
 */
export function AdminLogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 44 44"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
    >
      <circle cx="22" cy="22" r="20.5" />
      <path d="M15 10c-2.6 0-4 2.4-4 5s1.6 4.6 4 4.6 4-2 4-4.6-1.4-5-4-5Zm0 9.6L19 35" />
      <path d="M29 10c2.6 0 4 2.4 4 5s-1.6 4.6-4 4.6-4-2-4-4.6 1.4-5 4-5Zm0 9.6L25 35" />
      <path d="M13 31.5h18" />
    </svg>
  );
}
