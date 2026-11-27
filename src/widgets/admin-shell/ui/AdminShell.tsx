"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { resetCatalog } from "@/entities/admin-catalog";
import { resetOrders } from "@/entities/admin-order";
import { clearRecommendationLog } from "@/entities/recommendation-log";
import { SignOutButton } from "@/features/admin-auth";
import { DEMO_MODE } from "@/shared/config";
import { Modal, PillButton, TextButton, kit } from "@/shared/ui/admin-kit";

import { AdminCursor } from "./AdminCursor";
import { AdminLogoMark } from "./AdminLogo";
import { RouteSlash } from "./RouteSlash";
import styles from "./AdminShell.module.css";

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/products", label: "상품" },
  { href: "/admin/orders", label: "주문" },
  { href: "/admin/tastes", label: "맛·성분" },
  { href: "/admin/recommendations", label: "AI 추천" },
] as const;

const isCurrent = (pathname: string, href: string) =>
  href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

/** 아래로 210px 넘게 내리면 머리글을 숨기고, 위로 올리면 다시 보여 줍니다(원본 고정 머리글). */
function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last.current;
      if (Math.abs(delta) < 8) return;
      setHidden(delta > 0 && y > 210);
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return hidden;
}

/** 어드민 공통 틀: 본문 바로가기, 머리글(로고·메뉴), 데모 안내, 본문, 바닥글. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hidden = useHideOnScroll();
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const reset = () => {
    resetCatalog();
    resetOrders();
    clearRecommendationLog();
    setResetOpen(false);
    setAnnouncement("데모 데이터를 처음 상태로 되돌렸습니다.");
  };

  const navLinks = (className?: string, onNavigate?: () => void) =>
    NAV.map((item) => (
      <li key={item.href}>
        <Link
          href={item.href}
          className={className}
          onClick={onNavigate}
          aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
        >
          {item.label}
        </Link>
      </li>
    ));

  return (
    <>
      <RouteSlash key={pathname} />
      <AdminCursor />
      <a href="#admin-main" className={styles.skip}>
        본문 바로가기
      </a>
      <header className={styles.header} data-hidden={hidden}>
        <Link href="/admin" className={styles.logo} aria-label="Dessert Land 어드민 대시보드">
          <AdminLogoMark className={styles.logoMark} />
          <span className={styles.logoText} aria-hidden="true">
            Dessert Land
            <span className={styles.logoSub}>Back office</span>
          </span>
        </Link>
        <nav aria-label="어드민 메뉴" className={styles.nav}>
          <ul className={styles.navList}>{navLinks(styles.navLink)}</ul>
          <Link href="/ko" className={`${styles.navLink} ${styles.shopLink}`}>
            쇼핑몰 보기
          </Link>
          <SignOutButton />
        </nav>
        <button
          type="button"
          className={styles.menuButton}
          aria-haspopup="dialog"
          onClick={() => setMenuOpen(true)}
        >
          메뉴
        </button>
      </header>
      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="메뉴">
        <nav aria-label="어드민 메뉴(모바일)">
          <ul className={styles.menuList}>
            {/* 메뉴에서 화면을 고르면 메뉴를 닫습니다. */}
            {navLinks(undefined, () => setMenuOpen(false))}
            <li>
              <Link href="/ko">쇼핑몰 보기</Link>
            </li>
          </ul>
        </nav>
        <SignOutButton />
      </Modal>
      {DEMO_MODE ? (
        <section aria-label="데모 안내" className={`${kit.notice} ${styles.banner}`}>
          <p className={styles.bannerText}>
            공개 데모입니다. 시드 데이터로 움직이며, 고친 내용은 이 브라우저에만 저장되어 같은
            브라우저의 쇼핑몰에 바로 반영됩니다. 서버나 다른 사람의 화면은 바뀌지 않습니다.
          </p>
          <TextButton aria-haspopup="dialog" onClick={() => setResetOpen(true)}>
            데모 데이터 초기화
          </TextButton>
        </section>
      ) : null}
      <p role="status" className={kit.srOnly}>
        {announcement}
      </p>
      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="데모 데이터를 초기화할까요?"
      >
        <div className={styles.resetBody}>
          <p>
            이 브라우저에 저장한 상품 수정·새 상품·주문 처리 기록·AI 추천 기록을 지우고 시드
            데이터로 되돌립니다. 쇼핑몰의 장바구니와 주문 내역은 그대로 둡니다.
          </p>
          <div className={styles.resetActions}>
            <PillButton onClick={reset}>초기화</PillButton>
            <TextButton onClick={() => setResetOpen(false)}>그대로 두기</TextButton>
          </div>
        </div>
      </Modal>
      <main id="admin-main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        <p>Dessert Land 어드민 · 상품 정보와 주문은 데모용 예시입니다.</p>
        <p>
          글꼴: Bodoni Moda · Noto Serif KR · Pretendard(SIL OFL 1.1) ·{" "}
          <a href="https://github.com/ryushin01/DessertLand#출처">출처</a>
        </p>
      </footer>
    </>
  );
}
