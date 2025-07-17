import crypto from 'crypto'

export async function uploadArAsset(url: string, restaurantId: string) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary environment variables are not set')
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = restaurantId
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
    .digest('hex')

  const body = new FormData()
  body.append('file', url)
  body.append('api_key', process.env.CLOUDINARY_API_KEY)
  body.append('timestamp', String(timestamp))
  body.append('folder', folder)
  body.append('signature', signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
    {
      method: 'POST',
      body,
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Cloudinary upload failed: ${response.status} ${text}`)
  }

  const data = (await response.json()) as { secure_url: string }
  return data.secure_url
}
