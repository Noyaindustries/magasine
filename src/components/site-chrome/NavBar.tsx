import Link from "next/link";
import { PRIMARY_NAV, REGION_NAV } from "@/data/site-home";

interface NavBarProps {
  categories?: { name: string; slug: string }[];
}

const DEFAULT_NAV = [
  ...PRIMARY_NAV,
  ...REGION_NAV.map(({ label, href }) => ({ label, href })),
];

export function NavBar({ categories }: NavBarProps) {
  const items = categories?.length
    ? categories.map((c) => ({ label: c.name, href: `/category/${c.slug}` }))
    : DEFAULT_NAV;

  return (
    <nav className="nav-bar">
      <div className="nav-bar-inner">
        {items.map((item) => (
          <Link key={item.label} href={item.href}>
            {item.label}
          </Link>
        ))}
        <div className="nav-bar-filler" />
        <div className="nav-edition">Global South Watch</div>
      </div>
    </nav>
  );
}
