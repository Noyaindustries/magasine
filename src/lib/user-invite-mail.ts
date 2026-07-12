import { CMS_ROLE_LABELS } from "@/components/admin/cms/cms-nav";
import {
  getNewsletterFromName,
  isNewsletterMailConfigured,
  sendNewsletterMail,
} from "@/lib/newsletter-mail";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import type { UserRole } from "@/types";

export function isUserInviteMailConfigured(): boolean {
  return isNewsletterMailConfigured();
}

export interface UserInviteEmailInput {
  to: string;
  name: string;
  role: UserRole;
  tempPassword?: string;
  passwordWasSetByAdmin?: boolean;
  inviterName?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildUserInviteEmailContent(input: UserInviteEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const loginUrl = `${getSiteUrl()}/login`;
  const roleLabel = CMS_ROLE_LABELS[input.role];
  const inviterLine = input.inviterName
    ? `${input.inviterName} invited you to join the team.`
    : `You have been invited to join ${SITE_NAME}.`;

  let credentialsText: string;
  let credentialsHtml: string;

  if (input.tempPassword) {
    credentialsText = [
      `Email: ${input.to}`,
      `Temporary password: ${input.tempPassword}`,
      "",
      "Please change this password after your first sign-in if possible.",
    ].join("\n");
    credentialsHtml = `
      <p><strong>Email:</strong> ${escapeHtml(input.to)}</p>
      <p><strong>Temporary password:</strong> <code style="background:#f4f4f5;padding:2px 6px;border-radius:4px;">${escapeHtml(input.tempPassword)}</code></p>
      <p style="color:#555;font-size:14px;">We recommend changing this password after your first sign-in.</p>
    `;
  } else if (input.passwordWasSetByAdmin) {
    credentialsText = [
      `Email: ${input.to}`,
      "Use the password your administrator shared with you.",
    ].join("\n");
    credentialsHtml = `
      <p><strong>Email:</strong> ${escapeHtml(input.to)}</p>
      <p>Use the password your administrator shared with you.</p>
    `;
  } else {
    credentialsText = `Email: ${input.to}\nSign in with the password you chose.`;
    credentialsHtml = `<p><strong>Email:</strong> ${escapeHtml(input.to)}</p>`;
  }

  const subject = `Invitation to join ${SITE_NAME}`;

  const text = [
    `Hello ${input.name},`,
    "",
    inviterLine,
    "",
    `Assigned role: ${roleLabel}.`,
    "",
    credentialsText,
    "",
    `Sign in: ${loginUrl}`,
    "",
    `— ${getNewsletterFromName()}`,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
  <body style="font-family:Georgia,'Times New Roman',serif;line-height:1.6;color:#111;max-width:560px;margin:0 auto;padding:24px;">
    <p>Hello ${escapeHtml(input.name)},</p>
    <p>${escapeHtml(inviterLine)}</p>
    <p>Your role: <strong>${escapeHtml(roleLabel)}</strong>.</p>
    ${credentialsHtml}
    <p style="margin-top:24px;">
      <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#c41e3a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;">
        Sign in
      </a>
    </p>
    <p style="font-size:13px;color:#666;margin-top:28px;">
      Direct link: <a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a>
    </p>
    <p style="font-size:13px;color:#888;margin-top:32px;">— ${escapeHtml(getNewsletterFromName())}</p>
  </body>
</html>`.trim();

  return { subject, text, html };
}

export async function sendUserInviteEmail(input: UserInviteEmailInput): Promise<void> {
  if (!isUserInviteMailConfigured()) {
    throw new Error("SMTP is not configured (SMTP_HOST, SMTP_FROM).");
  }

  const { subject, text, html } = buildUserInviteEmailContent(input);
  await sendNewsletterMail({
    to: input.to,
    subject,
    text,
    html,
  });
}
