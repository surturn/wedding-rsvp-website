import { NextRequest, NextResponse } from 'next/server'
import { signSessionToken, setSessionCookie, clearSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    const expectedPin = process.env.USHER_PIN?.trim()

    if (!expectedPin) {
      console.error('USHER_PIN is not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (pin?.trim() !== expectedPin) {
      return NextResponse.json(
        { error: 'Incorrect PIN' },
        { status: 401 }
      )
    }

    // PIN correct — sign a JWT and set it as an httpOnly cookie
    const token = await signSessionToken('usher')
    const response = NextResponse.json({ success: true })
    setSessionCookie(response, 'usher', token)

    return response
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}

// DELETE — log out (clear the cookie)
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  clearSessionCookie(response, 'usher')
  return response
}
