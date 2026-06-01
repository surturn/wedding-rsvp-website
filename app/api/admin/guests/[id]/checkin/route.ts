import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { fetchGuestById, patchGuest, normaliseGuest } from '@/lib/nocodb'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Allow both admin and usher sessions
  const adminAuth = await requireAuth(request, 'admin')
  const usherAuth = await requireAuth(request, 'usher')

  if (adminAuth instanceof NextResponse && usherAuth instanceof NextResponse) {
    // Neither admin nor usher session is valid
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: idParam } = await params
  const id = parseInt(idParam, 10)

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid guest ID' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const checkedIn = body.checkedIn === true

    // Build the patch payload
    const patchFields: Record<string, unknown> = {
      CheckedIn: checkedIn,
    }

    if (checkedIn) {
      patchFields.CheckedInAt = new Date().toISOString()
    } else {
      // If un-checking in, clear the timestamp
      patchFields.CheckedInAt = null
    }

    await patchGuest(id, patchFields)

    // Fetch the updated guest to return
    const updated = await fetchGuestById(id)
    if (!updated) {
      return NextResponse.json(
        { error: 'Guest not found after update' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, guest: updated })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { error: 'Failed to update check-in status' },
      { status: 500 }
    )
  }
}
