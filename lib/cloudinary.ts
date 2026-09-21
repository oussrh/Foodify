// lib/cloudinary.ts
import crypto from "crypto";
import { serverEnv } from "@/lib/env";

/**
 * Signed upload of a USDZ/GLB (a remote URL or a base64 string; Cloudinary fetches it) into
 * `restaurants/<second argument>`; the dish action passes the restaurant id, so AR files sit under
 * the id while branding sits under the slug. Throws on unset variables or any non-2xx answer.
 */
export async function uploadArAsset(fileUrl: string, restaurantSlug: string) {
  const cloudinary = serverEnv.cloudinary;
  if (!cloudinary) {
    throw new Error("Cloudinary environment variables are not set");
  }
  const { cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, apiSecret: CLOUDINARY_API_SECRET } = cloudinary;

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `restaurants/${restaurantSlug}`;

  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + CLOUDINARY_API_SECRET)
    .digest("hex");

  const formData = new FormData();
  formData.append("file", fileUrl); // Can be a remote URL or base64 string
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", folder);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `❌ Cloudinary upload failed: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();
  return data.secure_url as string;
}

/**
 * Signed upload of a logo or cover to `restaurants/<slug>/branding/<assetType>`: the fixed public
 * id makes a new upload replace the previous file. The signature is computed over `params`, so
 * the form fields and that map are kept in step. An SVG goes to the raw endpoint, not image.
 */
export async function uploadRestaurantAsset(
  file: File, 
  restaurantSlug: string, 
  assetType: 'logo' | 'cover'
) {
  const cloudinary = serverEnv.cloudinary;
  if (!cloudinary) {
    throw new Error("Cloudinary environment variables are not set");
  }
  const { cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, apiSecret: CLOUDINARY_API_SECRET } = cloudinary;

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `restaurants/${restaurantSlug}/branding`;
  
  // Use fixed public ID for restaurant asset (will replace existing)
  const publicId = assetType;
  
  // Determine resource type
  const resourceType = file.type === 'image/svg+xml' ? 'raw' : 'image';
  
  // Build parameters object for signature (only include parameters that will be sent)
  const params: Record<string, string> = {
    folder,
    public_id: publicId,
    timestamp: timestamp.toString()
  };
  
  // Add resource_type only if not 'image' (since 'image' is the default)
  if (resourceType !== 'image') {
    params.resource_type = resourceType;
  }
  
  // Sort parameters alphabetically and create signature string
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  console.log('Parameters to sign:', sortedParams);
  
  const signature = crypto
    .createHash("sha1")
    .update(sortedParams + CLOUDINARY_API_SECRET)
    .digest("hex");

  console.log('Generated signature:', signature);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", folder);
  formData.append("public_id", publicId);
  formData.append("signature", signature);
  
  // Only add resource_type if not 'image'
  if (resourceType !== 'image') {
    formData.append("resource_type", resourceType);
  }

  const uploadUrl = resourceType === 'raw' 
    ? `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`
    : `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `❌ Cloudinary upload failed: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();
  return data.secure_url as string;
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