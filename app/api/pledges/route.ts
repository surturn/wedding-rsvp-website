import { NextRequest, NextResponse } from 'next/server'
import { createPledge, fetchPledgeByPhone } from '@/lib/nocodb'

// Helper to normalize phone number to 254XXXXXXXXX
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) {
    return '254' + cleaned.substring(1)
  }
  if (cleaned.startsWith('254')) {
    return cleaned
  }
  if (cleaned.startsWith('+254')) {
    return cleaned.substring(1)
  }
  if (cleaned.length === 9) {
    return '254' + cleaned
  }
  return cleaned // fallback
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guestName, phoneNumber, pledgedAmount } = body

    if (!guestName || !phoneNumber || !pledgedAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: guestName, phoneNumber, pledgedAmount' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhone(phoneNumber)

    const existingPledge = await fetchPledgeByPhone(normalizedPhone)
    if (existingPledge) {
      return NextResponse.json(
        { error: 'A pledge with this phone number already exists', pledge: existingPledge },
        { status: 409 }
      )
    }

    const pledge = await createPledge({
      GuestName: guestName,
      PhoneNumber: normalizedPhone,
      PledgedAmount: Number(pledgedAmount),
      AmountPaid: 0,
      Status: 'PENDING',
    })

    return NextResponse.json({ success: true, pledge }, { status: 201 })
  } catch (error) {
    console.error('Failed to create pledge:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const phone = request.nextUrl.searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'Missing required query parameter: phone' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhone(phone)
    const pledge = await fetchPledgeByPhone(normalizedPhone)

    if (!pledge) {
      return NextResponse.json(
        { error: 'Pledge not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ pledge }, { status: 200 })
  } catch (error) {
    console.error('Failed to fetch pledge:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
