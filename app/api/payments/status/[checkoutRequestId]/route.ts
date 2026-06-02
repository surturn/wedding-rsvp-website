import { NextRequest, NextResponse } from 'next/server'
import { fetchMpesaPaymentByCheckoutId } from '@/lib/nocodb'

// ---------------------------------------------------------------------------
// GET /api/payments/status/[checkoutRequestId] — Poll payment status
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ checkoutRequestId: string }> }
) {
  try {
    const { checkoutRequestId } = await params

    if (!checkoutRequestId) {
      return NextResponse.json(
        { error: 'checkoutRequestId is required' },
        { status: 400 }
      )
    }

    const payment = await fetchMpesaPaymentByCheckoutId(checkoutRequestId)

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: payment.Status,
      mpesaReceiptNumber: payment.MpesaReceiptNumber,
      resultDesc: payment.ResultDesc,
      amount: payment.Amount,
      guestName: payment.GuestName,
    })
  } catch (error) {
    console.error('Payment status lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment status' },
      { status: 500 }
    )
  }
}
