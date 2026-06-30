"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

interface AlertItem {
  _id: string;
  text: string;
  link?: string;
}

export function NewsTicker({ alerts }: { alerts: AlertItem[] }) {
  if (!alerts.length) return null;

  const items = [...alerts, ...alerts];

  return (
    <div className="bg-charcoal text-white overflow-hidden">
      <div className="max-w-[1320px] mx-auto flex items-center">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-accent shrink-0 z-10">
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase whitespace-nowrap">
            Alerts
          </span>
        </div>
        <div className="overflow-hidden flex-1 relative">
          <div className="ticker-animate flex whitespace-nowrap">
            {items.map((alert, i) => (
              <span key={`${alert._id}-${i}`} className="inline-flex items-center">
                {alert.link ? (
                  <Link
                    href={alert.link}
                    className="px-6 py-2.5 text-sm hover:text-gold transition-colors"
                  >
                    {alert.text}
                  </Link>
                ) : (
                  <span className="px-6 py-2.5 text-sm">{alert.text}</span>
                )}
                <span className="text-gold/50">◆</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
