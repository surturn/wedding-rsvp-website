import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

// Serves the QR code image for a guest token. The email confirmation embeds
// this URL so the image loads in every client (data: URIs are blocked by
// Gmail and others). Tokens only map to a guest name through the
// usher-authenticated API, so this endpoint leaks no guest data.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const png = await QRCode.toBuffer(token, {
    type: 'png',
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'M',
  })

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
