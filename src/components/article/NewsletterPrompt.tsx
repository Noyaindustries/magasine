import Link from "next/link";
import { Mail } from "lucide-react";
import { isNewsletterMultiEditionEnabled } from "@/lib/newsletter-topics";
import { NewsletterSignupForm } from "@/components/newsletter/NewsletterSignupForm";

export function NewsletterPrompt() {
  const multiEdition = isNewsletterMultiEditionEnabled();

  return (
    <aside className="article-newsletter-prompt" aria-labelledby="article-nl-heading">
      <div className="article-newsletter-prompt-icon" aria-hidden>
        <Mail className="w-6 h-6" />
      </div>
      <div className="article-newsletter-prompt-body">
        <span className="article-newsletter-prompt-kicker">Newsletter</span>
        <h3 id="article-nl-heading">Enjoyed this story?</h3>
        <p>
          {multiEdition
            ? "Get our free morning briefing and regional editions delivered to your inbox. All our journalism stays free — the newsletter is how we stay close to readers."
            : "Get our free daily briefing delivered to your inbox. All our journalism stays free — the newsletter is how we stay close to readers."}
        </p>
        <NewsletterSignupForm variant="inline" showTopics={false} />
        {multiEdition && (
          <p className="article-newsletter-prompt-more">
            <Link href="/newsletter">Browse all editions →</Link>
          </p>
        )}
      </div>
    </aside>
  );
}
