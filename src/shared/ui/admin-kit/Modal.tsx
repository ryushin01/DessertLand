"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import styles from "./admin-kit.module.css";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  closeLabel?: string;
};

/**
 * 전체 화면 검은 대화상자(원본 모바일 메뉴의 덮개). 네이티브 <dialog> showModal이라 바깥은 비활성(초점 가둠)이고,
 * Escape로 닫히며, 닫히면 열기 전에 초점이 있던 곳(트리거)으로 초점을 돌려줍니다.
 */
export function Modal({ open, onClose, title, children, closeLabel = "닫기" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      triggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onClose={() => {
        onClose();
        triggerRef.current?.focus();
      }}
    >
      {open ? (
        <div className={styles.dialogInner}>
          <button type="button" className={styles.dialogClose} onClick={() => ref.current?.close()}>
            {closeLabel}
          </button>
          <h2 id={titleId} className={styles.dialogTitle}>
            {title}
          </h2>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
