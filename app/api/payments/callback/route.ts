import { NextRequest, NextResponse } from 'next/server'
import { extractCallbackData, type MpesaCallbackBody } from '@/lib/mpesa'
import {
  fetchMpesaPaymentByCheckoutId,
  patchMpesaPayment,
  fetchPledgeByPhone,
  patchPledge,
} from '@/lib/nocodb'

// ---------------------------------------------------------------------------
// POST /api/payments/callback — Safaricom M-Pesa webhook
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // ALWAYS return 200 — Safaricom retries on non-200 responses
  try {
    const body = (await request.json()) as MpesaCallbackBody
    const data = extractCallbackData(body)

    console.log('M-Pesa callback received:', JSON.stringify(data))

    // ------ Look up payment in NocoDB ------
    try {
      const payment = await fetchMpesaPaymentByCheckoutId(
        data.checkoutRequestId
      )

      if (!payment) {
        console.warn(
          `No payment found for CheckoutRequestID: ${data.checkoutRequestId}`
        )
        return NextResponse.json(
          { ResultCode: 0, ResultDesc: 'Accepted' },
          { status: 200 }
        )
      }

      // ------ Determine status and patch ------
      let newStatus: 'COMPLETED' | 'FAILED' | 'CANCELLED' = 'FAILED'
      if (data.resultCode === 0) newStatus = 'COMPLETED'
      else if (data.resultCode === 1032) newStatus = 'CANCELLED'

      await patchMpesaPayment(payment.Id, {
        ResultCode: data.resultCode,
        ResultDesc: data.resultDesc,
        Status: newStatus,
        MpesaReceiptNumber: data.mpesaReceiptNumber,
        TransactionDate: data.transactionDate,
        UpdatedAt: new Date().toISOString(),
      })

      // ------ Increment pledge if successful ------
      if (data.resultCode === 0 && data.phoneNumber) {
        try {
          const pledge = await fetchPledgeByPhone(data.phoneNumber)
          if (pledge) {
            const newAmountPaid = pledge.AmountPaid + (data.amount || 0)
            const pledgeStatus = newAmountPaid >= pledge.PledgedAmount ? 'FULFILLED' : 'PARTIAL'
            await patchPledge(pledge.Id, { 
              AmountPaid: newAmountPaid, 
              Status: pledgeStatus, 
              UpdatedAt: new Date().toISOString() 
            })
          }
        } catch (pledgeError) {
          console.error('Failed to update pledge in NocoDB:', pledgeError)
        }
      }
    } catch (dbError) {
      // Log but never fail the response — Safaricom must get 200
      console.error('Failed to update payment in NocoDB:', dbError)
    }
  } catch (parseError) {
    console.error('Failed to parse callback body:', parseError)
  }

  return NextResponse.json(
    { ResultCode: 0, ResultDesc: 'Accepted' },
    { status: 200 }
  )
}
