import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { fetchGuests, createGuest } from '@/lib/nocodb'

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

// ---------------------------------------------------------------------------
// POST — add a walk-in / missing guest and check them in immediately.
// Door fallback for anyone not in the system (deleted row, lost email, etc.).
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, 'usher')
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const parsedCount = Number(body.guestCount)
    const guestCount =
      Number.isFinite(parsedCount) && parsedCount > 0 ? Math.floor(parsedCount) : 1
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''

    const guest = await createGuest({
      name,
      phone,
      guestCount,
      attending: true,
      checkedIn: true,
    })

    return NextResponse.json({ guest }, { status: 201 })
  } catch (error) {
    console.error('Error adding guest:', error)
    return NextResponse.json({ error: 'Failed to add guest' }, { status: 500 })
  }
}
