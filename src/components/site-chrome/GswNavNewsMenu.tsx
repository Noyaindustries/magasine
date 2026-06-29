"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { NEWS_MENU_NAV } from "@/data/site-home";
import { isNewsMenuItemActive } from "@/lib/news-hub";
import { GswNavMegaMenu } from "@/components/site-chrome/GswNavMegaMenu";

export function GswNavNewsMenu() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const isItemActive = useCallback(
    (path: string, href: string) => isNewsMenuItemActive(path, categoryParam, href),
    [categoryParam]
  );

  return (
    <GswNavMegaMenu
      label="News"
      panelKicker="Reporting"
      panelTitle="News & coverage"
      items={NEWS_MENU_NAV}
      align="start"
      isItemActive={isItemActive}
    />
  );
}
