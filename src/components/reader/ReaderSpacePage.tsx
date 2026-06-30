"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ReaderSpaceGuest } from "@/components/reader/ReaderSpaceGuest";
import { ReaderSpaceView } from "@/components/reader/ReaderSpaceView";
import type { ReaderNewsletterStatus, ReaderProfileData } from "@/components/reader/types";
import { toastNetworkError } from "@/lib/api-toast";
import { toast } from "@/lib/toast";

export function ReaderSpacePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<ReaderProfileData | null>(null);
  const [newsletter, setNewsletter] = useState<ReaderNewsletterStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    if (!session?.user) return;
    setLoading(true);
    Promise.all([
      fetch("/api/user/profile").then(async (r) => {
        if (!r.ok) {
          toast.error("Unable to load your profile.");
          return null;
        }
        return r.json() as Promise<ReaderProfileData>;
      }),
      fetch("/api/newsletter").then(async (r) => {
        if (!r.ok) return null;
        return r.json() as Promise<ReaderNewsletterStatus>;
      }),
    ])
      .then(([profileData, newsletterData]) => {
        if (profileData) setProfile(profileData);
        if (newsletterData) setNewsletter(newsletterData);
      })
      .catch(() => toastNetworkError())
      .finally(() => setLoading(false));
  }, [session?.user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (status === "loading") {
    return (
      <div className="reader-space">
        <div className="reader-loading">
          <div className="reader-loading-spinner" aria-hidden />
          <p>Loading your reader space…</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return <ReaderSpaceGuest />;
  }

  return (
    <ReaderSpaceView
      sessionName={session.user.name ?? "Reader"}
      sessionEmail={session.user.email ?? ""}
      sessionImage={session.user.image}
      profile={profile}
      newsletter={newsletter}
      loading={loading}
      onProfileRefresh={loadData}
    />
  );
}
