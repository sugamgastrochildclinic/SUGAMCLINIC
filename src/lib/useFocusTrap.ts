"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Focus-trap for modal dialogs (WCAG 2.4.3 / 2.1.2 — no keyboard trap escape,
 * focus stays within the dialog).
 *
 * When `active` becomes true:
 *   - remembers the previously focused element,
 *   - moves focus to the first focusable element inside the container,
 *   - cycles Tab / Shift+Tab within the container,
 * and restores focus to the trigger when `active` becomes false / unmounts.
 *
 * Returns a ref to attach to the dialog container element.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(active: boolean) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );

    // Move focus into the dialog (first focusable, else the container itself).
    const first = focusables()[0];
    if (first) first.focus();
    else {
      container.setAttribute("tabindex", "-1");
      container.focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const activeEl = document.activeElement;

      if (e.shiftKey) {
        if (activeEl === firstEl || !container.contains(activeEl)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else if (activeEl === lastEl || !container.contains(activeEl)) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    container.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("keydown", onKeyDown);
      // Restore focus to whatever opened the dialog.
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [active]);

  return containerRef;
}
