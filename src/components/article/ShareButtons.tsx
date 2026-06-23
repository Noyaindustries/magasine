"use client";

import { Link2 } from "lucide-react";
import {
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
} from "@/components/ui/SocialIcons";

interface ShareButtonsProps {
  url: string;
  title: string;
  variant?: "default" | "premium";
  layout?: "column" | "row";
}

export function ShareButtons({
  url,
  title,
  variant = "default",
  layout = "column",
}: ShareButtonsProps) {
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      label: "Facebook",
      brand: "facebook",
    },
    {
      icon: TwitterIcon,
      href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
      label: "X (Twitter)",
      brand: "twitter",
    },
    {
      icon: WhatsappIcon,
      href: `https://wa.me/?text=${encodedTitle}%20${encoded}`,
      label: "WhatsApp",
      brand: "whatsapp",
    },
    {
      icon: LinkedinIcon,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      label: "LinkedIn",
      brand: "linkedin",
    },
  ];

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
  };

  if (variant === "premium") {
    return (
      <div className={`art-share${layout === "row" ? " art-share--row" : ""}`}>
        <span className="art-share-label">Share</span>
        <div className="art-share-buttons">
          {shareLinks.map(({ icon: Icon, href, label, brand }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share on ${label}`}
              className={`art-share-btn art-share-btn--${brand}`}
            >
              <Icon className="w-4 h-4" />
            </a>
          ))}
          <button
            type="button"
            onClick={copyLink}
            aria-label="Copy link"
            className="art-share-btn art-share-btn--copy"
          >
            <Link2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted tracking-wider uppercase mr-2">Share</span>
      {shareLinks.map(({ icon: Icon, href, label, brand }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${label}`}
          className={`social-link social-link--${brand} w-9 h-9 flex items-center justify-center rounded-md hover:scale-110 transition-transform`}
        >
          <Icon className="w-4 h-4" />
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        className="w-9 h-9 flex items-center justify-center rounded-sm border border-border hover:bg-gold hover:text-white hover:border-gold transition-all duration-300"
      >
        <Link2 className="w-4 h-4" />
      </button>
    </div>
  );
}
