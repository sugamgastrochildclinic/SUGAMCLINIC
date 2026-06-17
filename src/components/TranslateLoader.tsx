"use client";

import { useEffect } from "react";

/**
 * Loads the Google Translate widget ONLY when a non-English translation is
 * actually active (a `googtrans` cookie pointing at a non-`en` language).
 *
 * Why: the Translate element script is ~120 KB of JS that English visitors —
 * the default and the LCP path — never need. The language switcher (Navbar)
 * sets the `googtrans` cookie and reloads; on that reload this loader sees the
 * cookie and injects the script so the translation is applied. English users
 * download zero translate JS.
 */
export default function TranslateLoader() {
  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    const code = match ? decodeURIComponent(match[1]).split("/").pop() : null;

    // Default / English → load nothing.
    if (!code || code === "en") return;

    // Avoid double-injection on client navigations.
    if (document.getElementById("google-translate-script")) return;

    (window as any).googleTranslateElementInit = function () {
      try {
        const g = (window as any).google;
        if (g && g.translate && g.translate.TranslateElement) {
          new g.translate.TranslateElement(
            { pageLanguage: "en", includedLanguages: "en,ta", autoDisplay: false },
            "google_translate_element"
          );
        }
      } catch {
        // Non-critical enhancement — never throw.
      }
    };

    // Swallow benign cross-origin error events from the widget.
    const onErr = (ev: Event) => {
      const target = ev.target as { src?: string; href?: string } | null;
      const src = (target && (target.src || target.href)) || "";
      if (typeof src === "string" && src.indexOf("translate.google") !== -1) {
        ev.stopImmediatePropagation();
      }
    };
    window.addEventListener("error", onErr, true);

    const s = document.createElement("script");
    s.id = "google-translate-script";
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    document.body.appendChild(s);

    return () => window.removeEventListener("error", onErr, true);
  }, []);

  return null;
}
