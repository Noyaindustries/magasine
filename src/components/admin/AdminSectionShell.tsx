import type { ReactNode } from "react";

export interface AdminSectionStat {
  value: string | number;
  label: string;
}

interface AdminSectionShellProps {
  eyebrow: string;
  title: ReactNode;
  description: string;
  stats?: AdminSectionStat[];
  actions?: ReactNode;
  children: ReactNode;
  pulse?: "gold" | "green" | "blue";
}

export function AdminSectionShell({
  eyebrow,
  title,
  description,
  stats,
  actions,
  children,
  pulse = "gold",
}: AdminSectionShellProps) {
  return (
    <div className="adm-root">
      <header className="adm-hero">
        <div className="adm-hero-mesh" aria-hidden />
        <div className="adm-hero-inner">
          <div>
            <p className="adm-hero-eyebrow">
              <span className={`adm-hero-dot adm-hero-dot--${pulse}`} aria-hidden />
              {eyebrow}
            </p>
            <h1 className="adm-hero-title">{title}</h1>
            <p className="adm-hero-desc">{description}</p>
          </div>
          {(stats?.length || actions) && (
            <div className="adm-hero-aside">
              {stats && stats.length > 0 && (
                <div className="adm-hero-stats">
                  {stats.map((stat) => (
                    <div key={stat.label} className="adm-stat">
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {actions && <div className="adm-hero-actions">{actions}</div>}
            </div>
          )}
        </div>
      </header>
      <div className="adm-body">{children}</div>
    </div>
  );
}
