import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import {
  BRANDING_UPLOAD_DIR,
  type BrandingAssetType,
  brandingFileBaseName,
  extensionFromMime,
} from "@/lib/branding";
import { isBlobStorageEnabled, uploadBlobFile } from "@/lib/blob-storage";

// Nom de fichier unique à chaque upload : l'URL change à chaque changement de logo/
// favicon, ce qui invalide le cache du navigateur ET du CDN (sinon l'ancienne image
// reste servie indéfiniment sur une URL fixe).
function uniqueBrandingFilename(type: BrandingAssetType, mime: string): string {
  const ext = extensionFromMime(mime);
  return `${brandingFileBaseName(type)}-${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
}

async function saveBrandingFileToDiskInternal(
  type: BrandingAssetType,
  file: File
): Promise<string> {
  const filename = uniqueBrandingFilename(type, file.type);
  const dir = path.join(process.cwd(), BRANDING_UPLOAD_DIR);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/branding/${filename}`;
}

async function saveBrandingFileToBlobInternal(
  type: BrandingAssetType,
  file: File
): Promise<string> {
  const filename = uniqueBrandingFilename(type, file.type);
  // Cache CDN court (1 h) en complément du nom unique, par prudence.
  return uploadBlobFile(`branding/${filename}`, file, file.type, {
    cacheControlMaxAge: 3600,
  });
}

export async function saveBrandingFile(type: BrandingAssetType, file: File): Promise<string> {
  if (process.env.NODE_ENV === "production" && !isBlobStorageEnabled()) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is required for branding uploads in production."
    );
  }
  if (isBlobStorageEnabled()) {
    return saveBrandingFileToBlobInternal(type, file);
  }
  return saveBrandingFileToDiskInternal(type, file);
}

/** @deprecated Use `saveBrandingFile` */
export const saveBrandingFileToDisk = saveBrandingFile;
