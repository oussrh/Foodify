// lib/cloudinary.ts
import crypto from "crypto";

export async function uploadArAsset(fileUrl: string, restaurantSlug: string) {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary environment variables are not set");
  }

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

export async function uploadRestaurantAsset(
  file: File, 
  restaurantSlug: string, 
  assetType: 'logo' | 'cover'
) {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary environment variables are not set");
  }

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
export async function uploadLogo(file: File, restaurantSlug: string) {
  return uploadRestaurantAsset(file, restaurantSlug, 'logo');
}

export async function uploadCoverImage(file: File, restaurantSlug: string) {
  return uploadRestaurantAsset(file, restaurantSlug, 'cover');
}