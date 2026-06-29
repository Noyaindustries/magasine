const CATEGORY_COLORS: Record<string, string> = {
  économie: "var(--amber)",
  economie: "var(--amber)",
  politique: "var(--cms-red)",
  sports: "var(--amber)",
  local: "var(--green)",
  investigations: "var(--purple)",
  finance: "var(--green)",
  santé: "var(--t3)",
  sante: "var(--t3)",
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

export function formatRelativeEn(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatArticleDate(iso: string) {
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" })} ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
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
    const label = scheduledAt
      ? `Scheduled — ${new Date(scheduledAt).toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" })} ${new Date(scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
      : "Scheduled";
    return <span className="badge b-plan">{label}</span>;
  }
  if (status === "draft") return <span className="badge b-draft">Draft</span>;
  if (status === "archived") return <span className="badge b-arch">Archived</span>;
  return <span className="badge b-draft">{status}</span>;
}
