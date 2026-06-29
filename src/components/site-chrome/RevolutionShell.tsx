"use client";

import { useEffect } from "react";

export function RevolutionShell() {
  useEffect(() => {
    const header = document.querySelector(".header");
    const home = document.querySelector(".home-page--revolution");
    if (!home) return;

    document.body.classList.add("body--revolution");

    const onScroll = () => {
      header?.classList.toggle("header--scrolled", window.scrollY > 24);
    };

    const onMove = (e: MouseEvent) => {
      if (home instanceof HTMLElement) {
        home.style.setProperty("--spot-x", `${e.clientX}px`);
        home.style.setProperty("--spot-y", `${e.clientY}px`);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    onScroll();

    return () => {
      document.body.classList.remove("body--revolution");
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <div className="revolution-spotlight" aria-hidden />;
}
