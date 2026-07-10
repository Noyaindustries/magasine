"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { isNewsMenuItemActive } from "@/lib/news-hub";
import { GswNavMegaMenu } from "@/components/site-chrome/GswNavMegaMenu";
import type { PublicNewsMenuItem } from "@/lib/public-nav";

interface GswNavNewsMenuProps {
  items: PublicNewsMenuItem[];
}

export function GswNavNewsMenu({ items }: GswNavNewsMenuProps) {
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
      items={items}
      align="start"
      isItemActive={isItemActive}
    />
  );
}
