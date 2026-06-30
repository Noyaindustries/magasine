"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MapPin, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SocialLinks } from "@/components/ui/SocialIcons";
import { UtilityPageLayout } from "@/components/layout/UtilityPageLayout";
import { toast } from "@/lib/toast";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };
      if (res.ok) {
        setSuccess(true);
        setForm({ name: "", email: "", subject: "", message: "" });
        toast.success("Message sent — we will reply within 48 hours.");
      } else {
        toast.error(data.error ?? "Failed to send message");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "utility-input";

  return (
    <UtilityPageLayout
      eyebrow="Contact"
      eyebrowIcon={MessageSquare}
      title="Contact us"
      lead="Editorial, partnerships, advertising, or tips — our team responds within 48 business hours."
      actions={[
        { label: "Press room", href: "/press" },
        { label: "Advertising", href: "/advertising" },
      ]}
      wide
    >
      <div className="utility-body--split">
        <aside className="utility-aside">
          <h2>Reach us</h2>
          <ul className="utility-contact-list">
            {[
              { icon: Mail, label: "Email", value: "contact@globalsouthwatch.com" },
              { icon: Phone, label: "Phone", value: "+225 27 00 00 00 00" },
              { icon: MapPin, label: "Headquarters", value: "Abidjan, Côte d'Ivoire" },
            ].map(({ icon: Icon, label, value }) => (
              <li key={label}>
                <Icon className="utility-contact-icon" aria-hidden />
                <div>
                  <p className="utility-contact-label">{label}</p>
                  <p>{value}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="utility-aside-box">
            <p className="utility-aside-lead">Follow Global South Watch</p>
            <SocialLinks variant="inline" iconClassName="w-5 h-5" />
          </div>
        </aside>

        <section className="utility-card utility-contact-panel">
          <h2>Send a message</h2>
          {success ? (
            <div className="utility-success-box">
              <p className="utility-success-title">Message sent</p>
              <p>Thank you! We will get back to you shortly.</p>
              <button type="button" onClick={() => setSuccess(false)} className="utility-inline-link">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="utility-form">
              <div className="utility-form-row">
                <div>
                  <label htmlFor="contact-name">Name</label>
                  <input
                    id="contact-name"
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="contact-email">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="contact-subject">Subject</label>
                <input
                  id="contact-subject"
                  className={inputClass}
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  className={`${inputClass} utility-textarea`}
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" variant="gold" disabled={loading}>
                {loading ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
        </section>
      </div>
    </UtilityPageLayout>
  );
}
