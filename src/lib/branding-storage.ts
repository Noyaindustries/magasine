import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  BRANDING_UPLOAD_DIR,
  type BrandingAssetType,
  brandingFileBaseName,
  extensionFromMime,
} from "@/lib/branding";
import { isBlobStorageEnabled, uploadBlobFile } from "@/lib/blob-storage";

async function saveBrandingFileToDiskInternal(
  type: BrandingAssetType,
  file: File
): Promise<string> {
  const ext = extensionFromMime(file.type);
  const filename = `${brandingFileBaseName(type)}${ext}`;
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
  const ext = extensionFromMime(file.type);
  const filename = `${brandingFileBaseName(type)}${ext}`;
  return uploadBlobFile(`branding/${filename}`, file, file.type);
}

export async function saveBrandingFile(type: BrandingAssetType, file: File): Promise<string> {
  if (isBlobStorageEnabled()) {
    return saveBrandingFileToBlobInternal(type, file);
  }
  return saveBrandingFileToDiskInternal(type, file);
}

/** @deprecated Use `saveBrandingFile` */
export const saveBrandingFileToDisk = saveBrandingFile;
