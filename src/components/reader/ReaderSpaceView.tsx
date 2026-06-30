"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  Bookmark,
  Clock,
  Crown,
  Heart,
  LayoutGrid,
  LogOut,
  Mail,
  Search,
  Sparkles,
  User,
} from "lucide-react";
import { ReaderArticleCard } from "@/components/reader/ReaderArticleCard";
import type {
  ReaderNewsletterStatus,
  ReaderProfileData,
  ReaderTab,
} from "@/components/reader/types";
import { NEWSLETTER_TOPICS } from "@/lib/newsletter-topics";
import { toast } from "@/lib/toast";
import { readApiError, toastNetworkError } from "@/lib/api-toast";

interface ReaderSpaceViewProps {
  sessionName: string;
  sessionEmail: string;
  sessionImage?: string | null;
  profile: ReaderProfileData | null;
  newsletter: ReaderNewsletterStatus | null;
  loading: boolean;
  onProfileRefresh: () => void;
}

const TABS: { id: ReaderTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "history", label: "History", icon: Clock },
  { id: "newsletter", label: "Newsletter", icon: Mail },
];

export function ReaderSpaceView({
  sessionName,
  sessionEmail,
  sessionImage,
  profile,
  newsletter,
  loading,
  onProfileRefresh,
}: ReaderSpaceViewProps) {
  const [tab, setTab] = useState<ReaderTab>("overview");
  const [saveLoadingId, setSaveLoadingId] = useState<string | null>(null);

  const savedCount = profile?.savedArticles.length ?? 0;
  const historyCount = profile?.readingHistory.length ?? 0;
  const isPremium = profile?.user.isPremium ?? false;

  const toggleSave = useCallback(
    async (articleId: string) => {
      setSaveLoadingId(articleId);
      try {
        const res = await fetch("/api/user/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId }),
        });
        if (res.ok) {
          const data = (await res.json()) as { saved: boolean };
          toast.success(data.saved ? "Article saved" : "Removed from saved");
          onProfileRefresh();
        } else {
          toast.error(await readApiError(res, "Action failed"));
        }
      } catch {
        toastNetworkError();
      } finally {
        setSaveLoadingId(null);
      }
    },
    [onProfileRefresh]
  );

  const preferenceLabels = (newsletter?.preferences ?? [])
    .map((id) => NEWSLETTER_TOPICS.find((t) => t.id === id)?.label)
    .filter(Boolean) as string[];

  const recentSaved = profile?.savedArticles.slice(0, 3) ?? [];
  const recentHistory = profile?.readingHistory.slice(0, 3) ?? [];

  return (
    <div className="reader-space">
      <header className="reader-hero">
        <div className="reader-hero-inner">
          <p className="reader-hero-eyebrow">
            <User aria-hidden />
            Reader space
          </p>

          <div className="reader-hero-profile">
            <div
              className={`reader-hero-avatar${isPremium ? " reader-hero-avatar--premium" : ""}`}
            >
              {sessionImage ? (
                <Image src={sessionImage} alt="" fill sizes="96px" />
              ) : (
                (sessionName?.charAt(0) ?? "?").toUpperCase()
              )}
            </div>
            <div className="reader-hero-meta">
              <h1 className="reader-hero-name">{sessionName}</h1>
              <p className="reader-hero-email">{sessionEmail}</p>
              <div className="reader-hero-badges">
                {isPremium && (
                  <span className="reader-badge reader-badge--gold">
                    <Crown aria-hidden />
                    Premium reader
                  </span>
                )}
                <span className="reader-badge reader-badge--blue">
                  <Sparkles aria-hidden />
                  Member
                </span>
                {newsletter?.subscribed && (
                  <span className="reader-badge reader-badge--mail">
                    <Mail aria-hidden />
                    Newsletter
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="reader-kpi-strip" aria-label="Reading statistics">
            <div className="reader-kpi">
              <span className="reader-kpi-val">{loading ? "—" : savedCount}</span>
              <span className="reader-kpi-lbl">Saved</span>
            </div>
            <div className="reader-kpi">
              <span className="reader-kpi-val">{loading ? "—" : historyCount}</span>
              <span className="reader-kpi-lbl">Read</span>
            </div>
            <div className="reader-kpi">
              <span className="reader-kpi-val">
                {loading ? "—" : newsletter?.subscribed ? preferenceLabels.length : 0}
              </span>
              <span className="reader-kpi-lbl">Editions</span>
            </div>
            <div className="reader-kpi">
              <span className="reader-kpi-val">{isPremium ? "Pro" : "Free"}</span>
              <span className="reader-kpi-lbl">Plan</span>
            </div>
          </div>
        </div>
      </header>

      <div className="reader-body">
        <nav className="reader-tabs" aria-label="Reader sections">
          {TABS.map(({ id, label, icon: Icon }) => {
            const count =
              id === "saved" ? savedCount : id === "history" ? historyCount : undefined;
            return (
              <button
                key={id}
                type="button"
                className={`reader-tab${tab === id ? " is-active" : ""}`}
                onClick={() => setTab(id)}
                aria-current={tab === id ? "page" : undefined}
              >
                <Icon aria-hidden />
                {label}
                {count !== undefined && count > 0 && (
                  <span className="reader-tab-count">{count}</span>
                )}
              </button>
            );
          })}
        </nav>

        {tab === "overview" && (
          <div className="reader-panel reader-grid-2">
            <div className="reader-section">
              <div className="reader-section-head">
                <div>
                  <h2 className="reader-section-title">
                    <Bookmark aria-hidden />
                    Recently saved
                  </h2>
                  <p className="reader-section-sub">Your bookmarked investigations</p>
                </div>
                {savedCount > 0 && (
                  <button
                    type="button"
                    className="reader-section-link"
                    onClick={() => setTab("saved")}
                  >
                    View all →
                  </button>
                )}
              </div>
              {loading ? (
                <OverviewSkeleton />
              ) : recentSaved.length > 0 ? (
                <div className="reader-articles">
                  {recentSaved.map((article) => (
                    <ReaderArticleCard key={article._id} article={article} />
                  ))}
                </div>
              ) : (
                <EmptyBlock
                  icon={Bookmark}
                  title="No saved articles yet"
                  text='Tap "Save" on any article to build your personal reading list.'
                  href="/"
                  cta="Explore stories"
                />
              )}
            </div>

            <aside className="reader-section">
              <div className="reader-section-head">
                <div>
                  <h2 className="reader-section-title">Quick actions</h2>
                  <p className="reader-section-sub">Shortcuts for your reader account</p>
                </div>
              </div>
              <div className="reader-actions">
                <Link href="/search" className="reader-action">
                  <span className="reader-action-icon">
                    <Search aria-hidden />
                  </span>
                  <span className="reader-action-text">
                    <strong>Search archive</strong>
                    <span>Find topics, authors, regions</span>
                  </span>
                </Link>
                <Link href="/newsletter" className="reader-action">
                  <span className="reader-action-icon">
                    <Mail aria-hidden />
                  </span>
                  <span className="reader-action-text">
                    <strong>Newsletter</strong>
                    <span>
                      {newsletter?.subscribed ? "Manage editions" : "Subscribe for free"}
                    </span>
                  </span>
                </Link>
                <Link href="/donate" className="reader-action">
                  <span className="reader-action-icon">
                    <Heart aria-hidden />
                  </span>
                  <span className="reader-action-text">
                    <strong>Support journalism</strong>
                    <span>Help keep reporting independent</span>
                  </span>
                </Link>
                <button
                  type="button"
                  className="reader-action"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
                >
                  <span className="reader-action-icon">
                    <LogOut aria-hidden />
                  </span>
                  <span className="reader-action-text">
                    <strong>Sign out</strong>
                    <span>End your session securely</span>
                  </span>
                </button>
              </div>
            </aside>

            <div className="reader-section" style={{ gridColumn: "1 / -1" }}>
              <div className="reader-section-head">
                <div>
                  <h2 className="reader-section-title">
                    <Clock aria-hidden />
                    Continue reading
                  </h2>
                  <p className="reader-section-sub">Pick up where you left off</p>
                </div>
                {historyCount > 0 && (
                  <button
                    type="button"
                    className="reader-section-link"
                    onClick={() => setTab("history")}
                  >
                    Full history →
                  </button>
                )}
              </div>
              {loading ? (
                <OverviewSkeleton />
              ) : recentHistory.length > 0 ? (
                <div className="reader-articles">
                  {recentHistory.map((article) => (
                    <ReaderArticleCard key={article._id} article={article} showExcerpt />
                  ))}
                </div>
              ) : (
                <EmptyBlock
                  icon={Clock}
                  title="No reading history"
                  text="Articles you read will appear here automatically."
                  href="/"
                  cta="Start reading"
                />
              )}
            </div>
          </div>
        )}

        {tab === "saved" && (
          <div className="reader-panel reader-section">
            <div className="reader-section-head">
              <div>
                <h2 className="reader-section-title">
                  <Bookmark aria-hidden />
                  Saved articles
                </h2>
                <p className="reader-section-sub">
                  {savedCount} article{savedCount === 1 ? "" : "s"} in your library
                </p>
              </div>
            </div>
            {loading ? (
              <OverviewSkeleton rows={4} />
            ) : profile?.savedArticles.length ? (
              <div className="reader-articles">
                {profile.savedArticles.map((article) => (
                  <ReaderArticleCard
                    key={article._id}
                    article={article}
                    showExcerpt
                    saved
                    saveLoading={saveLoadingId === article._id}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            ) : (
              <EmptyBlock
                icon={Bookmark}
                title="Your library is empty"
                text='Save articles from any story page with the bookmark button.'
                href="/"
                cta="Discover articles"
              />
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="reader-panel reader-section">
            <div className="reader-section-head">
              <div>
                <h2 className="reader-section-title">
                  <Clock aria-hidden />
                  Reading history
                </h2>
                <p className="reader-section-sub">
                  {historyCount} article{historyCount === 1 ? "" : "s"} recently read
                </p>
              </div>
            </div>
            {loading ? (
              <OverviewSkeleton rows={4} />
            ) : profile?.readingHistory.length ? (
              <div className="reader-articles">
                {profile.readingHistory.map((article) => {
                  const isSaved = profile.savedArticles.some((a) => a._id === article._id);
                  return (
                    <ReaderArticleCard
                      key={article._id}
                      article={article}
                      showExcerpt
                      saved={isSaved}
                      saveLoading={saveLoadingId === article._id}
                      onToggleSave={toggleSave}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyBlock
                icon={Clock}
                title="No history yet"
                text="Your reading trail builds as you explore our reporting."
                href="/"
                cta="Browse latest"
              />
            )}
          </div>
        )}

        {tab === "newsletter" && (
          <div className="reader-panel reader-newsletter-card">
            <div className="reader-section-head">
              <div>
                <h2 className="reader-section-title">
                  <Mail aria-hidden />
                  Newsletter preferences
                </h2>
                <p className="reader-section-sub">
                  Regional editions delivered to your inbox
                </p>
              </div>
            </div>

            {newsletter?.subscribed ? (
              <>
                <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
                  You are subscribed to Global South Watch newsletters.
                  {preferenceLabels.length > 0
                    ? " Your selected editions appear below."
                    : " Choose your regional editions to personalize coverage."}
                </p>
                {preferenceLabels.length > 0 && (
                  <div className="reader-topic-chips">
                    {preferenceLabels.map((label) => (
                      <span key={label} className="reader-topic-chip">
                        {label}
                      </span>
                    ))}
                  </div>
                )}
                <Link href="/newsletter" className="reader-empty-cta">
                  Update preferences
                </Link>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 20px" }}>
                  Get curated briefings on Africa, Latin America, Asia-Pacific, and
                  more — free, independent, and aligned with your interests.
                </p>
                <div className="reader-topic-chips">
                  {NEWSLETTER_TOPICS.slice(0, 5).map((topic) => (
                    <span key={topic.id} className="reader-topic-chip">
                      {topic.label}
                    </span>
                  ))}
                </div>
                <Link href="/newsletter" className="reader-empty-cta">
                  Subscribe now
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyBlock({
  icon: Icon,
  title,
  text,
  href,
  cta,
}: {
  icon: typeof Bookmark;
  title: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="reader-empty">
      <Icon className="reader-empty-icon" aria-hidden />
      <h3>{title}</h3>
      <p>{text}</p>
      <Link href={href} className="reader-empty-cta">
        {cta}
      </Link>
    </div>
  );
}

function OverviewSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="reader-articles">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="reader-article" style={{ pointerEvents: "none" }}>
          <div className="reader-skeleton" style={{ width: 112, height: 72 }} />
          <div style={{ flex: 1 }}>
            <div className="reader-skeleton" style={{ height: 18, marginBottom: 8, width: "85%" }} />
            <div className="reader-skeleton" style={{ height: 12, width: "40%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
