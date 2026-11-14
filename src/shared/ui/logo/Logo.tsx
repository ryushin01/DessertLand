import Image from "next/image";

type LogoProps = { className?: string; size?: number };

/** 디저트 랜드 로고(딸기 케이크 아이콘). 이름은 부모 요소(링크의 aria-label 등)에서 제공합니다. */
export function Logo({ className, size = 36 }: LogoProps) {
  return (
    <Image
      src="/brand/logo.png"
      alt=""
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
    />
  );
}
