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
    ? `${input.inviterName} vous a invité(e) à rejoindre l'équipe.`
    : `Vous avez été invité(e) à rejoindre ${SITE_NAME}.`;

  let credentialsText: string;
  let credentialsHtml: string;

  if (input.tempPassword) {
    credentialsText = [
      `E-mail : ${input.to}`,
      `Mot de passe temporaire : ${input.tempPassword}`,
      "",
      "Changez ce mot de passe après votre première connexion si possible.",
    ].join("\n");
    credentialsHtml = `
      <p><strong>E-mail :</strong> ${escapeHtml(input.to)}</p>
      <p><strong>Mot de passe temporaire :</strong> <code style="background:#f4f4f5;padding:2px 6px;border-radius:4px;">${escapeHtml(input.tempPassword)}</code></p>
      <p style="color:#555;font-size:14px;">Nous vous recommandons de modifier ce mot de passe après votre première connexion.</p>
    `;
  } else if (input.passwordWasSetByAdmin) {
    credentialsText = [
      `E-mail : ${input.to}`,
      "Utilisez le mot de passe que votre administrateur vous a communiqué.",
    ].join("\n");
    credentialsHtml = `
      <p><strong>E-mail :</strong> ${escapeHtml(input.to)}</p>
      <p>Utilisez le mot de passe que votre administrateur vous a communiqué.</p>
    `;
  } else {
    credentialsText = `E-mail : ${input.to}\nConnectez-vous avec le mot de passe que vous avez choisi.`;
    credentialsHtml = `<p><strong>E-mail :</strong> ${escapeHtml(input.to)}</p>`;
  }

  const subject = `Invitation à rejoindre ${SITE_NAME}`;

  const text = [
    `Bonjour ${input.name},`,
    "",
    inviterLine,
    "",
    `Rôle attribué : ${roleLabel}.`,
    "",
    credentialsText,
    "",
    `Connexion : ${loginUrl}`,
    "",
    `— ${getNewsletterFromName()}`,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="fr">
  <body style="font-family:Georgia,'Times New Roman',serif;line-height:1.6;color:#111;max-width:560px;margin:0 auto;padding:24px;">
    <p>Bonjour ${escapeHtml(input.name)},</p>
    <p>${escapeHtml(inviterLine)}</p>
    <p>Votre rôle : <strong>${escapeHtml(roleLabel)}</strong>.</p>
    ${credentialsHtml}
    <p style="margin-top:24px;">
      <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#c41e3a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;">
        Se connecter
      </a>
    </p>
    <p style="font-size:13px;color:#666;margin-top:28px;">
      Lien direct : <a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a>
    </p>
    <p style="font-size:13px;color:#888;margin-top:32px;">— ${escapeHtml(getNewsletterFromName())}</p>
  </body>
</html>`.trim();

  return { subject, text, html };
}

export async function sendUserInviteEmail(input: UserInviteEmailInput): Promise<void> {
  if (!isUserInviteMailConfigured()) {
    throw new Error("SMTP non configuré (SMTP_HOST, SMTP_FROM).");
  }

  const { subject, text, html } = buildUserInviteEmailContent(input);
  await sendNewsletterMail({
    to: input.to,
    subject,
    text,
    html,
  });
}
