"use client";

import { useEffect } from "react";

export function ProgressBar() {
  useEffect(() => {
    const bar = document.getElementById("progressBar");
    if (!bar) return;

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      bar.style.transform = `scaleX(${progress})`;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <div className="article-preview-bar" id="progressBar" aria-hidden />;
}
