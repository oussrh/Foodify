// components/qr/qr-urls.ts
// The QR code images of a menu URL, from the qrserver.com API: ink and paper of the design,
// a quiet zone of 2, PNG. Three sizes: the card (300), the large preview (600), the
// download (1200).

export const QR_SIZES = { card: 300, large: 600, download: 1200 } as const

export const qrCodeUrl = (url: string, size: number) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&color=1b1a17&bgcolor=ffffff&qzone=2&format=png`
