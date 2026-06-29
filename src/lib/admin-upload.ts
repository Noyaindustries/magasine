import type { BrandingAssetType } from "@/lib/branding";

export async function uploadAdminMedia(
  file: File,
  title?: string
): Promise<{ url: string; _id?: string }> {
  const body = new FormData();
  body.append("file", file);
  if (title?.trim()) body.append("title", title.trim());

  const res = await fetch("/api/admin/medias", { method: "POST", body });
  const data = (await res.json()) as { error?: string; url?: string; _id?: string };

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Upload failed.");
  }

  return { url: data.url, _id: data._id };
}

export async function uploadBrandingAsset(
  file: File,
  type: BrandingAssetType
): Promise<{ url: string }> {
  const body = new FormData();
  body.append("file", file);
  body.append("type", type);

  const res = await fetch("/api/admin/branding/upload", { method: "POST", body });
  const data = (await res.json()) as { error?: string; url?: string };

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Upload failed.");
  }

  return { url: data.url };
}
