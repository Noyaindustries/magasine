"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function isInViewport(el: Element) {
  const rect = el.getBoundingClientRect();
  const viewHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.top < viewHeight - 24 && rect.bottom > 0;
}

function applyRevealDelays(el: Element) {
  const delay = el.getAttribute("data-reveal-delay");
  if (delay) {
    (el as HTMLElement).style.transitionDelay = `${delay}ms`;
  }
}

function markVisible(el: Element) {
  el.classList.add("visible");
}

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let cancelled = false;

    const bindRevealElements = () => {
      if (cancelled) return;

      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              markVisible(entry.target);
              observer?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.05, rootMargin: "0px 0px -24px 0px" }
      );

      document.querySelectorAll(".reveal:not(.visible)").forEach((el) => {
        applyRevealDelays(el);
        if (isInViewport(el)) {
          markVisible(el);
        } else {
          observer?.observe(el);
        }
      });
    };

    // Run after paint — Next.js may mount page content slightly after route change
    const rafId = requestAnimationFrame(() => {
      bindRevealElements();
      window.setTimeout(bindRevealElements, 80);
    });

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        document.querySelectorAll(".reveal").forEach((el) => {
          if (isInViewport(el)) {
            markVisible(el);
          }
        });
        bindRevealElements();
      }
    };

    window.addEventListener("pageshow", onPageShow);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [pathname]);

  return null;
}
