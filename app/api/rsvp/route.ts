import { NextRequest, NextResponse } from 'next/server'
import { fetchGuests } from '@/lib/nocodb'

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  'https://n8n-production-4aeb1.up.railway.app/webhook/rsvp-submit'

// Normalise a phone number to the 254XXXXXXXXX form used in NocoDB.
function normalisePhone(raw: string): string {
  let value = raw.replace(/[\s\-+]/g, '')
  if (value.startsWith('0')) {
    value = '254' + value.slice(1)
  }
  return value.replace(/\D/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const { name, attending, guestCount, message, phone, email } = body

    if (typeof name !== 'string' || typeof attending !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: name, attending' },
        { status: 400 }
      )
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      )
    }

    const normalisedPhone = typeof phone === 'string' ? normalisePhone(phone) : ''

    // ── Duplicate handling (#3) ────────────────────────────────────────────
    // Reject re-submissions from a phone that already RSVP'd, with a clear
    // message, instead of letting them be silently dropped downstream.
    // Fail-open: if the lookup itself errors, don't block the RSVP.
    if (normalisedPhone) {
      try {
        const existing = await fetchGuests(`(Phone,eq,${normalisedPhone})`)
        if (existing.length > 0) {
          return NextResponse.json(
            {
              error:
                'This phone number has already RSVP\'d. If you need to change your response, please contact the couple directly.',
              duplicate: true,
            },
            { status: 409 }
          )
        }
      } catch (lookupError) {
        console.error('Duplicate-check lookup failed, continuing:', lookupError)
      }
    }

    // Forward to n8n webhook with exact required keys
    const payload = {
      name: name,
      email: email,
      attending: attending,
      guestCount: typeof guestCount === 'number' ? guestCount : (Number(guestCount) || 0),
      message: typeof message === 'string' ? message : '',
      phone: normalisedPhone,
    }

    let response: Response
    try {
      response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (networkError) {
      // n8n unreachable (cold start / down). Surface a real error so the guest
      // retries — never fake success, which silently loses the RSVP (#2).
      console.error('n8n webhook unreachable:', networkError)
      return NextResponse.json(
        { error: 'We could not reach our RSVP service. Please try again in a moment.' },
        { status: 502 }
      )
    }

    // Read the body once so we can inspect it whether or not the status is ok.
    const rawBody = await response.text()
    let parsed: { success?: boolean; message?: string } | null = null
    try {
      parsed = rawBody ? JSON.parse(rawBody) : null
    } catch {
      parsed = null
    }

    // Treat both a non-2xx status and an explicit { success: false } as failure.
    if (!response.ok || parsed?.success === false) {
      console.error('n8n webhook error:', response.status, rawBody)
      return NextResponse.json(
        {
          error:
            parsed?.message ||
            'Your RSVP could not be saved. Please try again or contact the couple directly.',
        },
        { status: response.ok ? 502 : response.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('RSVP submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
