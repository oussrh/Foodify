// lib/cloudinary/uploadArAsset.ts
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
