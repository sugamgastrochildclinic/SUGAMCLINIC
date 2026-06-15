"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type ToastType = "success" | "error" | "info";

type FeedbackCtx = {
  /** Card-style confirmation dialog. Resolves true if confirmed. */
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  /** Card-style toast notification. */
  notify: (type: ToastType, message: string) => void;
};

// Graceful fallback when used outside the provider (keeps any consumer safe).
const AdminFeedbackContext = createContext<FeedbackCtx>({
  confirm: async (o) =>
    typeof window !== "undefined" ? window.confirm(o.message) : false,
  notify: () => {},
});

export function useAdminFeedback() {
  return useContext(AdminFeedbackContext);
}

let toastSeq = 0;

export function AdminFeedbackProvider({ children }: { children: React.ReactNode }) {
  // --- Confirm dialog state ---
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const [busy, setBusy] = useState(false);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setConfirmState(opts);
    setBusy(false);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setConfirmState(null);
    setBusy(false);
  };

  // --- Toast state ---
  const [toasts, setToasts] = useState<
    { id: number; type: ToastType; message: string }[]
  >([]);

  const notify = useCallback((type: ToastType, message: string) => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const danger = confirmState?.danger ?? true;

  return (
    <AdminFeedbackContext.Provider value={{ confirm, notify }}>
      {children}

      {/* Confirmation modal — card UI */}
      {confirmState && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => !busy && settle(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                  danger
                    ? "bg-rose-50 border-rose-100"
                    : "bg-teal-tint/50 border-teal/10"
                }`}
              >
                <AlertTriangle
                  className={`w-6 h-6 ${danger ? "text-rose-500" : "text-teal"}`}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-lg text-slate-800">
                  {confirmState.title || "Please confirm"}
                </h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  {confirmState.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => settle(false)}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
              >
                {confirmState.cancelText || "Cancel"}
              </button>
              <button
                onClick={() => {
                  setBusy(true);
                  settle(true);
                }}
                disabled={busy}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60 ${
                  danger ? "bg-rose-500 hover:bg-rose-600" : "bg-teal hover:bg-teal-dark"
                }`}
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : danger ? (
                  <Trash2 className="w-4 h-4" />
                ) : null}
                {confirmState.confirmText || (danger ? "Delete" : "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast stack — card UI */}
      <div className="fixed bottom-6 right-6 z-[130] flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-semibold bg-white animate-loader-fade-up ${
              t.type === "success"
                ? "border-emerald-200 text-emerald-700"
                : t.type === "error"
                ? "border-rose-200 text-rose-700"
                : "border-slate-200 text-slate-700"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : t.type === "error" ? (
              <XCircle className="w-5 h-5 text-rose-500" />
            ) : (
              <Info className="w-5 h-5 text-teal" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </AdminFeedbackContext.Provider>
  );
}
