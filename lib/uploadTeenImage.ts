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

export async function prepareTeenImage(file: File): Promise<File> {
  const jpeg = await toJpegFile(file);
  return compressImage(jpeg);
}

/**
 * Uploads an already-converted, already-compressed JPEG (from `prepareTeenImage`)
 * to R2 and saves its key. Does not compress/convert — callers must do that first.
 */
export async function uploadTeenImage(finalFile: File, lieutenantId: string): Promise<void> {
  const res = await fetch("/api/lieutenants/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lieutenantId, fileType: finalFile.type }),
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

  const saveRes = await fetch("/api/lieutenants/save-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lieutenantId, key }),
  });

  if (!saveRes.ok) {
    const text = await saveRes.text();
    throw new Error(`Failed to save image key: ${saveRes.status} ${saveRes.statusText} - ${text}`);
  }
}
