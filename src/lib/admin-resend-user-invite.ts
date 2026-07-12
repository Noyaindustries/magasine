import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { User } from "@/models/User";
import type { UserRole } from "@/types";
import { canManageUsers } from "@/lib/permissions";
import { sendUserInviteEmail, isUserInviteMailConfigured } from "@/lib/user-invite-mail";

export interface ResendUserInviteInput {
  userId: string;
  actorRole: UserRole;
  inviterName?: string;
}

export interface ResendUserInviteResult {
  email: string;
  name: string;
  role: UserRole;
  tempPassword?: string;
  inviteEmailSent: boolean;
  inviteEmailError?: string;
}

export async function resendUserInviteAsAdmin(
  input: ResendUserInviteInput
): Promise<{ result?: ResendUserInviteResult; error?: string; status?: number }> {
  if (!canManageUsers(input.actorRole)) {
    return { error: "Access denied.", status: 403 };
  }

  if (!isUserInviteMailConfigured()) {
    return {
      error: "SMTP is not configured. Add SMTP_HOST and SMTP_FROM to your environment.",
      status: 503,
    };
  }

  const user = await User.findById(input.userId);
  if (!user) {
    return { error: "User not found.", status: 404 };
  }

  if (user.isBanned) {
    return { error: "Cannot invite a banned account.", status: 400 };
  }

  const tempPassword = randomBytes(9).toString("base64url");
  user.password = await bcrypt.hash(tempPassword, 12);
  await user.save();

  let inviteEmailSent = false;
  let inviteEmailError: string | undefined;

  try {
    await sendUserInviteEmail({
      to: user.email,
      name: user.name,
      role: user.role,
      tempPassword,
      inviterName: input.inviterName,
    });
    inviteEmailSent = true;
  } catch (error) {
    inviteEmailError = error instanceof Error ? error.message : "Failed to send email.";
    console.error("[user-invite] resend failed", user.email, error);
  }

  return {
    result: {
      email: user.email,
      name: user.name,
      role: user.role,
      tempPassword: inviteEmailSent ? undefined : tempPassword,
      inviteEmailSent,
      inviteEmailError,
    },
  };
}

export async function sendInviteAfterUserCreation(options: {
  email: string;
  name: string;
  role: UserRole;
  tempPassword?: string;
  passwordWasSetByAdmin?: boolean;
  inviterName?: string;
}): Promise<{ inviteEmailSent: boolean; inviteEmailError?: string }> {
  if (!isUserInviteMailConfigured()) {
    return { inviteEmailSent: false };
  }

  try {
    await sendUserInviteEmail({
      to: options.email,
      name: options.name,
      role: options.role,
      tempPassword: options.tempPassword,
      passwordWasSetByAdmin: options.passwordWasSetByAdmin,
      inviterName: options.inviterName,
    });
    return { inviteEmailSent: true };
  } catch (error) {
    const inviteEmailError = error instanceof Error ? error.message : "Failed to send email.";
    console.error("[user-invite] create failed", options.email, error);
    return { inviteEmailSent: false, inviteEmailError };
  }
}
