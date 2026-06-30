import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginPageClient, LoginPageFallback } from "@/components/auth/LoginPageClient";
import { ensureDefaultAdmin } from "@/lib/ensure-admin";
import { isGoogleAuthEnabled } from "@/lib/auth-secret";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Global South Watch — save articles, track your reading history, and join the conversation on independent journalism from the Global South.",
};

export default async function LoginPage() {
  if (process.env.NODE_ENV === "development") {
    await ensureDefaultAdmin({ resetPassword: true });
  }

  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageClient googleAuthEnabled={isGoogleAuthEnabled()} />
    </Suspense>
  );
}
