import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { fetchAllMpesaPayments } from '@/lib/nocodb'

export async function GET(request: NextRequest) {
  // Verify admin session cookie
  const auth = await requireAuth(request, 'admin')
  if (auth instanceof NextResponse) return auth

  try {
    const payments = await fetchAllMpesaPayments()
    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Failed to fetch payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment data' },
      { status: 500 }
    )
  }
}
