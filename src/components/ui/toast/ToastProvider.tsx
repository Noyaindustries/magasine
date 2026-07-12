"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  X,
} from "lucide-react";
import { dismissToast, subscribeToasts, type ToastItem, type ToastVariant } from "@/lib/toast";
import "./toast.css";

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
  loading: Loader2,
};

function ToastCard({ item }: { item: ToastItem }) {
  const Icon = ICONS[item.variant];
  const isLoading = item.variant === "loading";

  return (
    <div
      className={`app-toast app-toast--${item.variant}`}
      role={item.variant === "error" ? "alert" : "status"}
      aria-live={item.variant === "error" ? "assertive" : "polite"}
    >
      <span className="app-toast__icon" aria-hidden>
        <Icon className={isLoading ? "app-toast__spin" : undefined} size={18} />
      </span>
      <div className="app-toast__body">
        <p className="app-toast__title">{item.title}</p>
        {item.description ? <p className="app-toast__desc">{item.description}</p> : null}
      </div>
      {!isLoading ? (
        <button
          type="button"
          className="app-toast__close"
          aria-label="Close notification"
          onClick={() => dismissToast(item.id)}
        >
          <X size={14} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

export function ToastProvider() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setItems), []);

  if (items.length === 0) return null;

  return (
    <div className="app-toast-viewport" aria-label="Notifications">
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  );
}
