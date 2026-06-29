"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

export type GswNavMegaItem = {
  label: string;
  href: string;
  description: string;
  accent?: string;
};

type GswNavMegaMenuProps = {
  label: string;
  panelKicker: string;
  panelTitle: string;
  items: readonly GswNavMegaItem[];
  align?: "start" | "end";
  isItemActive?: (pathname: string, href: string) => boolean;
};

function defaultIsItemActive(pathname: string, href: string) {
  const base = href.split("#")[0] ?? href;
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function GswNavMegaMenu({
  label,
  panelKicker,
  panelTitle,
  items,
  align = "end",
  isItemActive = defaultIsItemActive,
}: GswNavMegaMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [pathKey, setPathKey] = useState(pathname);

  if (pathKey !== pathname) {
    setPathKey(pathname);
    setOpen(false);
  }

  const anyActive = items.some((item) => isItemActive(pathname, item.href));
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        close();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div
      ref={rootRef}
      className={`gsw-nav-mega gsw-nav-mega--align-${align}${open ? " is-open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`gsw-nav-mega-trigger gsw-nav-link${anyActive ? " is-active" : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <ChevronDown className="gsw-nav-mega-chevron" size={16} aria-hidden />
      </button>

      <div id={panelId} className="gsw-nav-mega-panel" aria-hidden={!open}>
        <div className="gsw-nav-mega-panel-head">
          <span className="gsw-nav-mega-panel-kicker">{panelKicker}</span>
          <span className="gsw-nav-mega-panel-title">{panelTitle}</span>
        </div>
        <div className="gsw-nav-mega-panel-body">
          {items.map((item) => {
            const current = isItemActive(pathname, item.href);
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`gsw-nav-mega-item${current ? " is-current" : ""}`}
                onClick={close}
              >
                <span
                  className="gsw-nav-mega-item-accent"
                  style={item.accent ? { background: item.accent } : undefined}
                  aria-hidden
                />
                <span className="gsw-nav-mega-item-text">
                  <span className="gsw-nav-mega-item-label">{item.label}</span>
                  <span className="gsw-nav-mega-item-desc">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
