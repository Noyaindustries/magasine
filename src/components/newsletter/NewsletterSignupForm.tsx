"use client";

import { useState } from "react";
import {
  DEFAULT_NEWSLETTER_TOPICS,
  NEWSLETTER_TOPICS,
  type NewsletterTopicId,
} from "@/lib/newsletter-topics";
import { toast } from "@/lib/toast";

type FormVariant = "banner" | "page" | "inline" | "sidebar";

interface NewsletterSignupFormProps {
  variant?: FormVariant;
  defaultEmail?: string;
  showTopics?: boolean;
  onSuccess?: () => void;
}

export function NewsletterSignupForm({
  variant = "page",
  defaultEmail = "",
  showTopics = true,
  onSuccess,
}: NewsletterSignupFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [topics, setTopics] = useState<NewsletterTopicId[]>([...DEFAULT_NEWSLETTER_TOPICS]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const toggleTopic = (id: NewsletterTopicId) => {
    setTopics((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== id);
      }
      return [...prev, id];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, preferences: topics }),
      });
      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "Subscription successful. Thank you!");
      toast.success(data.message ?? "Subscription successful. Thank you!");
      onSuccess?.();
    } catch {
      toast.error("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className={`nl-signup-success nl-signup-success--${variant}`}>
        <p className="nl-signup-success-title">You&apos;re on the list</p>
        <p className="nl-signup-success-text">{message}</p>
        <button
          type="button"
          className="nl-signup-reset"
          onClick={() => {
            setStatus("idle");
            setMessage("");
          }}
        >
          Update preferences
        </button>
      </div>
    );
  }

  const topicsVisible = showTopics && variant !== "inline";
  const topicsCompact = variant === "sidebar";

  return (
    <form
      className={`nl-signup nl-signup--${variant}${variant === "banner" ? " nl-form nl-form-premium" : ""}`}
      onSubmit={handleSubmit}
    >
      <label className="nl-signup-email-field">
        <span className={variant === "page" ? "nl-signup-field-label" : "sr-only"}>
          Email address
        </span>
        <input
          className="nl-input"
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>

      {topicsVisible && (
        <fieldset className="nl-signup-topics">
          <legend>{topicsCompact ? "Editions" : "Choose your editions"}</legend>
          <div
            className={`nl-signup-topics-grid${topicsCompact ? " nl-signup-topics-grid--sidebar" : ""}`}
          >
            {NEWSLETTER_TOPICS.map((topic) => {
              const checked = topics.includes(topic.id);
              return (
                <label
                  key={topic.id}
                  className={`nl-signup-topic${checked ? " is-checked" : ""}${topicsCompact ? " nl-signup-topic--compact" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTopic(topic.id)}
                  />
                  <span className="nl-signup-topic-text">
                    <strong>{topic.label}</strong>
                    {!topicsCompact && <small>{topic.description}</small>}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {variant === "inline" && (
        <p className="nl-signup-inline-hint">
          Free morning briefing · regional editions · unsubscribe anytime
        </p>
      )}

      <button type="submit" className="nl-btn" disabled={status === "loading"}>
        {status === "loading" ? (
          "Signing up..."
        ) : (
          <>
            <span className="nl-btn-full">
              {variant === "inline"
                ? "Get the newsletter"
                : variant === "sidebar"
                  ? "Subscribe"
                  : "Subscribe for free"}
            </span>
            <span className="nl-btn-short">Subscribe</span>
          </>
        )}
      </button>

      {status === "idle" && variant !== "inline" && variant !== "sidebar" && (
        <p className="nl-note">Free · No spam · Unsubscribe in one click</p>
      )}
      {status === "idle" && variant === "sidebar" && (
        <p className="nl-note nl-note--sidebar">Free · unsubscribe anytime</p>
      )}
    </form>
  );
}
