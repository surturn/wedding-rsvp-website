import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { fetchGuests } from '@/lib/nocodb'

export async function GET(request: NextRequest) {
  // Verify admin session cookie
  const auth = await requireAuth(request, 'admin')
  if (auth instanceof NextResponse) return auth

  try {
    const guests = await fetchGuests()
    return NextResponse.json({ guests })
  } catch (error) {
    console.error('Failed to fetch guests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch guest data' },
      { status: 500 }
    )
  }
}
