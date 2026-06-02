import { NextRequest, NextResponse } from 'next/server'
import { initiateStkPush } from '@/lib/mpesa'
import { createMpesaPayment } from '@/lib/nocodb'

// ---------------------------------------------------------------------------
// POST /api/payments/stk-push — Initiate an M-Pesa STK Push payment
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { phoneNumber, amount, guestName, message } = body

    // ------ Validation ------
    if (typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
      return NextResponse.json(
        { error: 'phoneNumber is required' },
        { status: 400 }
      )
    }

    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 }
      )
    }

    // ------ Normalise phone to 254 format ------
    let phone = phoneNumber.replace(/\s+/g, '')
    if (phone.startsWith('+')) phone = phone.slice(1)
    if (phone.startsWith('0')) phone = `254${phone.slice(1)}`
    if (!phone.startsWith('254')) phone = `254${phone}`

    // ------ Initiate STK Push via Daraja ------
    const stkResponse = await initiateStkPush({
      phoneNumber: phone,
      amount: numericAmount,
      accountReference: guestName || 'WeddingGift',
      description: message || 'Wedding Gift',
    })

    // ------ Persist PENDING payment in NocoDB ------
    await createMpesaPayment({
      GuestName: typeof guestName === 'string' ? guestName : '',
      PhoneNumber: phone,
      Amount: numericAmount,
      MerchantRequestID: stkResponse.MerchantRequestID,
      CheckoutRequestID: stkResponse.CheckoutRequestID,
      ResultCode: null,
      ResultDesc: null,
      MpesaReceiptNumber: null,
      TransactionDate: null,
      Status: 'PENDING',
      Purpose: typeof message === 'string' ? message : null,
    })

    return NextResponse.json({
      success: true,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      merchantRequestId: stkResponse.MerchantRequestID,
    })
  } catch (error) {
    console.error('STK Push error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}
