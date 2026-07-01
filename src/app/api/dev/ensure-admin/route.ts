import { NextResponse } from "next/server";
import {
  DEFAULT_ADMIN_EMAIL,
  ensureDefaultAdmin,
  getDefaultAdminPassword,
} from "@/lib/ensure-admin";

/** Dev only — creates or repairs the seed admin account. */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const admin = await ensureDefaultAdmin({ resetPassword: true });

  return NextResponse.json({
    ok: true,
    email: admin.email,
    password: getDefaultAdminPassword(),
    created: admin.created,
    repaired: admin.repaired,
    loginUrl: "/login",
    adminUrl: "/admin",
  });
}
