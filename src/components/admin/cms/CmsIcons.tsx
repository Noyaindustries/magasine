import {
  AlertTriangle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  BarChart3,
  Camera,
  Check,
  CheckCircle2,
  Columns2,
  Columns3,
  FileText,
  Film,
  Headphones,
  ImageIcon,
  LayoutGrid,
  Link2,
  List,
  ListOrdered,
  Mail,
  MessageSquare,
  Minus,
  Newspaper,
  Eye,
  Pencil,
  Quote,
  Star,
  Trash2,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CmsIconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function CmsIcon({ icon: Icon, size = 16, className, strokeWidth = 2 }: CmsIconProps) {
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={cn("cms-icon", className)}
      aria-hidden
    />
  );
}

export function CmsHintIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <Check size={14} className="cms-icon cms-icon--ok" aria-hidden />
  ) : (
    <AlertTriangle size={14} className="cms-icon cms-icon--warn" aria-hidden />
  );
}

export function CmsStatusIcon({ level }: { level: "ok" | "warn" | "error" }) {
  if (level === "ok") {
    return <CheckCircle2 size={13} className="cms-icon cms-icon--ok" aria-hidden />;
  }
  if (level === "warn") {
    return <AlertTriangle size={13} className="cms-icon cms-icon--warn" aria-hidden />;
  }
  return <X size={13} className="cms-icon cms-icon--error" aria-hidden />;
}

export function CmsMediaKindIcon({ kind }: { kind: string }) {
  const size = 28;
  switch (kind) {
    case "video":
      return <Film size={size} className="cms-icon cms-icon--video" aria-hidden />;
    case "podcast":
      return <Headphones size={size} className="cms-icon cms-icon--podcast" aria-hidden />;
    case "document":
      return <FileText size={size} className="cms-icon cms-icon--document" aria-hidden />;
    default:
      return <Newspaper size={size} className="cms-icon cms-icon--image" aria-hidden />;
  }
}

export const CmsDashboardIcons = {
  edit: Pencil,
  media: Camera,
  newsletter: Mail,
  comments: MessageSquare,
  report: BarChart3,
} as const;

export const CmsActionIcons = {
  edit: Pencil,
  view: Eye,
  delete: Trash2,
} as const;

export {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  Columns2,
  Columns3,
  ImageIcon,
  LayoutGrid,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Star,
  Trash2,
  Video,
};
