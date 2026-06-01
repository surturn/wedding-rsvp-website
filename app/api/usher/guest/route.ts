import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { fetchGuestByToken } from '@/lib/nocodb'

export async function GET(request: NextRequest) {
  // Verify usher session
  const auth = await requireAuth(request, 'usher')
  if (auth instanceof NextResponse) return auth

  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'Missing token parameter' },
      { status: 400 }
    )
  }

  try {
    const guest = await fetchGuestByToken(token)

    if (!guest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ guest })
  } catch (error) {
    console.error('Error fetching guest by token:', error)
    return NextResponse.json(
      { error: 'Failed to fetch guest' },
      { status: 500 }
    )
  }
}
