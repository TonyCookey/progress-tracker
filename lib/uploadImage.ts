import { compressImage } from "@/lib/compressImage";

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return type === "image/heic" || type === "image/heif" || name.endsWith(".heic") || name.endsWith(".heif");
}

async function toJpegFile(file: File): Promise<File> {
  if (!isHeic(file)) return file;

  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  const name = file.name.replace(/\.(heic|heif)$/i, ".jpg");

  return new File([blob], name || "image.jpg", { type: "image/jpeg" });
}

export async function prepareImage(file: File): Promise<File> {
  const jpeg = await toJpegFile(file);
  return compressImage(jpeg);
}

type Subject = "teen" | "general";

const ROUTES: Record<Subject, { uploadUrl: string; saveUrl: string; idField: string }> = {
  teen: { uploadUrl: "/api/lieutenants/upload-url", saveUrl: "/api/lieutenants/save-image", idField: "lieutenantId" },
  general: { uploadUrl: "/api/generals/upload-url", saveUrl: "/api/generals/save-image", idField: "userId" },
};

/**
 * Uploads an already-converted, already-compressed JPEG (from `prepareImage`)
 * to R2 and saves its key. Does not compress/convert — callers must do that first.
 */
export async function uploadPersonImage(finalFile: File, subject: Subject, id: string): Promise<void> {
  const { uploadUrl, saveUrl, idField } = ROUTES[subject];

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [idField]: id, fileType: finalFile.type }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get upload URL: ${res.status} ${res.statusText} - ${text}`);
  }

  const { url, key } = await res.json();

  const uploadRes = await fetch(url, {
    method: "PUT",
    body: finalFile,
    headers: { "Content-Type": finalFile.type },
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`Failed to upload image to storage: ${uploadRes.status} ${uploadRes.statusText} - ${text}`);
  }

  const saveRes = await fetch(saveUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [idField]: id, key }),
  });

  if (!saveRes.ok) {
    const text = await saveRes.text();
    throw new Error(`Failed to save image key: ${saveRes.status} ${saveRes.statusText} - ${text}`);
  }
}
