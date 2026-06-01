import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { fetchGuests } from '@/lib/nocodb'

export async function GET(request: NextRequest) {
  // Verify usher session
  const auth = await requireAuth(request, 'usher')
  if (auth instanceof NextResponse) return auth

  const search = request.nextUrl.searchParams.get('search')

  try {
    if (search && search.trim().length > 0) {
      // Search by name, phone, or email using NocoDB OR filter
      const q = search.trim()
      const where = `(name,like,%${q}%)~or(phone,like,%${q}%)~or(Email,like,%${q}%)`
      const guests = await fetchGuests(where)
      return NextResponse.json({ guests })
    }

    // No search — return all attending guests sorted by name
    const guests = await fetchGuests('(attending,eq,true)')
    // Sort: not-checked-in first, then by name
    guests.sort((a, b) => {
      if (a.CheckedIn !== b.CheckedIn) return a.CheckedIn ? 1 : -1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ guests })
  } catch (error) {
    console.error('Error fetching guests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch guests' },
      { status: 500 }
    )
  }
}
