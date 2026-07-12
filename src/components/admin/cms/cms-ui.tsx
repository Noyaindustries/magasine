import { formatRelativeEn, formatScheduledLabel } from "@/lib/relative-time";

export { formatRelativeEn };

const CATEGORY_COLORS: Record<string, string> = {
  economy: "var(--amber)",
  economics: "var(--amber)",
  économie: "var(--amber)",
  economie: "var(--amber)",
  politics: "var(--cms-red)",
  politique: "var(--cms-red)",
  sports: "var(--amber)",
  local: "var(--green)",
  investigations: "var(--purple)",
  finance: "var(--green)",
  health: "var(--t3)",
  santé: "var(--t3)",
  sante: "var(--t3)",
  news: "var(--cms-red)",
  culture: "var(--purple)",
  commentary: "var(--t2)",
  opinion: "var(--t2)",
  feature: "var(--amber)",
  explainer: "var(--t3)",
  multimedia: "var(--cms-red)",
  "special reports": "var(--amber)",
};

export function categoryAccent(name: string) {
  const key = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return CATEGORY_COLORS[key] ?? "var(--t2)";
}

export function authorInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function authorAvatarGradient(name: string) {
  const hues = ["#1A3896", "#22C55E", "#C9A227", "#60A5FA", "#8B5CF6", "#EC4899"];
  const code = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = hues[code % hues.length]!;
  return `linear-gradient(135deg, ${hue}, #141829)`;
}

export function formatArticleDate(iso: string) {
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", timeZone: "UTC" })} ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}`;
}

export function CmsStatusBadge({
  status,
  scheduledAt,
}: {
  status: string;
  scheduledAt?: string;
}) {
  if (status === "published") return <span className="badge b-pub">Published</span>;
  if (status === "review") return <span className="badge b-rev">In review</span>;
  if (status === "scheduled") {
    const label = scheduledAt ? formatScheduledLabel(scheduledAt) : "Scheduled";
    return (
      <span className="badge b-plan" suppressHydrationWarning>
        {label}
      </span>
    );
  }
  if (status === "draft") return <span className="badge b-draft">Draft</span>;
  if (status === "archived") return <span className="badge b-arch">Archived</span>;
  return <span className="badge b-draft">{status}</span>;
}
