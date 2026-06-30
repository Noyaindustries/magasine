import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export interface NewsletterMailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

let cachedTransporter: Transporter | null = null;

export function isNewsletterMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function getSmtpPort(): number {
  const port = Number(process.env.SMTP_PORT ?? "587");
  return Number.isFinite(port) ? port : 587;
}

function createTransporter(): Transporter {
  const port = getSmtpPort();
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
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

export async function sendNewsletterMail(payload: NewsletterMailPayload): Promise<void> {
  if (!isNewsletterMailConfigured()) {
    throw new Error("Newsletter SMTP is not configured (SMTP_HOST, SMTP_FROM).");
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"${getNewsletterFromName()}" <${getNewsletterFromAddress()}>`,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
}
