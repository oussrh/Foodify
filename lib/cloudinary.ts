// lib/cloudinary.ts
import crypto from "crypto";
import { serverEnv } from "@/lib/env";

type Endpoint = "auto" | "image" | "raw";

/**
 * One signed upload: `params` (without the timestamp, added here) are signed sorted by name as
 * Cloudinary requires, sent with the file to `<endpoint>/upload`, and the file's address answered.
 * Throws on unset variables or any non-2xx answer.
 */
async function signedUpload(endpoint: Endpoint, file: Blob | string, params: Record<string, string>, fileName?: string): Promise<string> {
  const cloudinary = serverEnv.cloudinary;
  if (!cloudinary) {
    throw new Error("Cloudinary environment variables are not set");
  }
  const signed: Record<string, string> = { ...params, timestamp: String(Math.floor(Date.now() / 1000)) };
  const toSign = Object.keys(signed).sort().map((key) => `${key}=${signed[key]}`).join("&");

  const formData = new FormData();
  if (typeof file === "string") formData.append("file", file); // a remote URL or a base64 string
  else formData.append("file", file, fileName);
  for (const [key, value] of Object.entries(signed)) formData.append(key, value);
  formData.append("api_key", cloudinary.apiKey);
  formData.append("signature", crypto.createHash("sha1").update(toSign + cloudinary.apiSecret).digest("hex"));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/${endpoint}/upload`, { method: "POST", body: formData });
  if (!response.ok) {
    throw new Error(`❌ Cloudinary upload failed: ${response.status} - ${await response.text()}`);
  }
  const data = await response.json();
  return data.secure_url as string;
}

/**
 * Signed upload of a USDZ/GLB (a remote URL or a base64 string; Cloudinary fetches it) into
 * `restaurants/<second argument>`; the dish action passes the restaurant id, so AR files sit under
 * the id while branding sits under the slug. Throws on unset variables or any non-2xx answer.
 */
export async function uploadArAsset(fileUrl: string, restaurantSlug: string) {
  return signedUpload("auto", fileUrl, { folder: `restaurants/${restaurantSlug}` });
}

/**
 * Signed upload of a model's bytes (a captured dish's GLB or USDZ) as a raw file to
 * `restaurants/<restaurantId>/ar`, named `<kind>_<time>.<kind>`: the extension stays in the address,
 * which AR Quick Look needs. Answers the file's address; throws on unset variables or a refusal.
 */
export async function uploadArFile(bytes: Uint8Array<ArrayBuffer>, kind: "glb" | "usdz", restaurantId: string) {
  const params = { folder: `restaurants/${restaurantId}/ar`, public_id: `${kind}_${Date.now()}.${kind}` };
  return signedUpload("raw", new Blob([bytes]), params, `dish.${kind}`);
}

/**
 * Signed upload of a logo or cover to `restaurants/<slug>/branding/<assetType>`: the fixed public
 * id makes a new upload replace the previous file. An SVG goes to the raw endpoint, not image,
 * and says so in its signed `resource_type`.
 */
export async function uploadRestaurantAsset(
  file: File,
  restaurantSlug: string,
  assetType: 'logo' | 'cover'
) {
  const raw = file.type === 'image/svg+xml';
  const params: Record<string, string> = { folder: `restaurants/${restaurantSlug}/branding`, public_id: assetType };
  if (raw) params.resource_type = 'raw';
  return signedUpload(raw ? 'raw' : 'image', file, params);
}

// Convenience functions
/** The logo variant, stored as `logoUrl`; no file check here, the action has parsed it with `imageUpload(5)` first. */
export async function uploadLogo(file: File, restaurantSlug: string) {
  return uploadRestaurantAsset(file, restaurantSlug, 'logo');
}

/** The cover variant, stored as `coverImageUrl`; no file check here, the action has parsed it with `imageUpload(10)` first. */
export async function uploadCoverImage(file: File, restaurantSlug: string) {
  return uploadRestaurantAsset(file, restaurantSlug, 'cover');
}
