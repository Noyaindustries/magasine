import { Download } from "lucide-react";
import Link from "next/link";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { formatDate } from "@/lib/utils";

interface SubscriberRow {
  email: string;
  preferences: string[];
  isActive: boolean;
  subscribedAt: Date;
}

interface NewsletterAdminPanelProps {
  subscribers: SubscriberRow[];
  totalActive: number;
}

export function NewsletterAdminPanel({ subscribers, totalActive }: NewsletterAdminPanelProps) {
  return (
    <AdminSectionShell
      eyebrow="Audience growth"
      title={
        <>
          Newsletter & <em>subscribers</em>
        </>
      }
      description="Monitor sign-ups, export lists for campaigns, and track active subscriber growth."
      pulse="green"
      stats={[
        { value: totalActive, label: "Active" },
        { value: subscribers.length, label: "Recent" },
      ]}
      actions={
        <a href="/api/admin/newsletter/export" className="adm-btn adm-btn--secondary">
          <Download className="w-4 h-4" aria-hidden />
          Export CSV
        </a>
      }
    >
      <div className="adm-panel adm-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th className="hidden md:table-cell">Preferences</th>
              <th>Status</th>
              <th className="hidden lg:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((sub) => (
              <tr key={sub.email}>
                <td className="font-medium">{sub.email}</td>
                <td className="text-muted hidden md:table-cell">
                  {(sub.preferences ?? []).join(", ") || "general"}
                </td>
                <td>
                  {sub.isActive ? (
                    <span className="adm-status adm-status--active">Active</span>
                  ) : (
                    <span className="adm-status adm-status--inactive">Unsubscribed</span>
                  )}
                </td>
                <td className="text-muted hidden lg:table-cell">{formatDate(sub.subscribedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {subscribers.length === 0 && (
          <p className="adm-empty">No newsletter subscribers yet.</p>
        )}
      </div>

      <p className="adm-footnote">
        Connect SendGrid or Resend via environment variables for production email delivery.{" "}
        <Link href="/newsletter">View public newsletter page →</Link>
      </p>
    </AdminSectionShell>
  );
}
