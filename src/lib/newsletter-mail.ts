import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export interface NewsletterMailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export class NewsletterSmtpAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NewsletterSmtpAuthError";
  }
}

let cachedTransporter: Transporter | null = null;

export function isNewsletterMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function getSmtpPort(): number {
  const port = Number(process.env.SMTP_PORT ?? "587");
  return Number.isFinite(port) ? port : 587;
}

function getSmtpUser(): string {
  return process.env.SMTP_USER?.trim() ?? "";
}

/** Gmail affiche les App Passwords en 4 groupes ; les espaces cassent l'auth. */
function getSmtpPass(): string {
  return (process.env.SMTP_PASS ?? "").replace(/\s+/g, "");
}

function createTransporter(): Transporter {
  const port = getSmtpPort();
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = getSmtpUser();
  const pass = getSmtpPass();

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    pool: true,
    // One SMTP connection is safest for Gmail; raise via NEWSLETTER_SMTP_MAX_CONNECTIONS if needed.
    maxConnections: resolveSmtpMaxConnections(),
    maxMessages: resolveSmtpMaxMessages(),
  });
}

function resolveSmtpMaxConnections(): number {
  const raw = Number(process.env.NEWSLETTER_SMTP_MAX_CONNECTIONS ?? "3");
  if (!Number.isFinite(raw)) return 3;
  return Math.min(10, Math.max(1, Math.floor(raw)));
}

function resolveSmtpMaxMessages(): number {
  const raw = Number(process.env.NEWSLETTER_SMTP_MAX_MESSAGES ?? "5000");
  if (!Number.isFinite(raw)) return 5000;
  return Math.min(10_000, Math.max(500, Math.floor(raw)));
}

function getTransporter(): Transporter {
  if (!cachedTransporter) {
    cachedTransporter = createTransporter();
  }
  return cachedTransporter;
}

export function getNewsletterFromAddress(): string {
  const from = process.env.SMTP_FROM?.trim();
  if (!from) {
    throw new Error("SMTP_FROM is not configured.");
  }
  return from;
}

export function getNewsletterFromName(): string {
  return process.env.NEWSLETTER_FROM_NAME?.trim() || "Global South Watch";
}

export function isSmtpAuthFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; responseCode?: number; message?: string };
  if (err.code === "EAUTH") return true;
  if (err.responseCode === 535 || err.responseCode === 454) return true;
  const message = err.message?.toLowerCase() ?? "";
  return (
    message.includes("invalid login") ||
    message.includes("badcredentials") ||
    message.includes("username and password not accepted") ||
    message.includes("too many login attempts")
  );
}

/** Vérifie une seule fois l'auth SMTP avant d'envoyer à toute la liste. */
export async function verifyNewsletterMailConnection(): Promise<void> {
  if (!isNewsletterMailConfigured()) {
    throw new Error("Newsletter SMTP is not configured (SMTP_HOST, SMTP_FROM).");
  }

  const user = getSmtpUser();
  const pass = getSmtpPass();
  if (!user || !pass) {
    throw new NewsletterSmtpAuthError(
      "SMTP_USER and SMTP_PASS are required. For Gmail, use an App Password (not your normal password)."
    );
  }

  try {
    await getTransporter().verify();
  } catch (error) {
    if (isSmtpAuthFailure(error)) {
      throw new NewsletterSmtpAuthError(
        "Gmail/SMTP rejected the login (invalid credentials or too many attempts). Use a Gmail App Password, wait ~15–30 min if rate-limited, then retry with a small test list."
      );
    }
    throw error;
  }
}

export async function sendNewsletterMail(payload: NewsletterMailPayload): Promise<void> {
  if (!isNewsletterMailConfigured()) {
    throw new Error("Newsletter SMTP is not configured (SMTP_HOST, SMTP_FROM).");
  }

  const transporter = getTransporter();
  try {
    await transporter.sendMail({
      from: `"${getNewsletterFromName()}" <${getNewsletterFromAddress()}>`,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
  } catch (error) {
    if (isSmtpAuthFailure(error)) {
      throw new NewsletterSmtpAuthError(
        "Gmail/SMTP authentication failed while sending. Check SMTP_USER / SMTP_PASS (App Password) and wait if Google rate-limited the account."
      );
    }
    throw error;
  }
}
