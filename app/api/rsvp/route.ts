import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { fetchGuests, createGuest } from '@/lib/nocodb'
import { sendBrevoEmail } from '@/lib/brevo'

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
    const count = typeof guestCount === 'number' ? guestCount : (Number(guestCount) || 0)

    // ── Duplicate handling ─────────────────────────────────────────────────
    // Reject re-submissions from a phone that already RSVP'd, with a clear
    // message, instead of letting them be silently dropped.
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

    // ── Save guest directly to NocoDB ──────────────────────────────────────
    // n8n was removed from this flow: its Railway service had no volume, so
    // its workflows were wiped on every restart. The app now owns the write.
    // The token doubles as the QR payload the usher scanner matches on.
    const token = randomBytes(16).toString('hex')

    const guest = await createGuest({
      name,
      phone: normalisedPhone,
      email,
      guestCount: count,
      attending,
      message: typeof message === 'string' ? message : '',
      token,
    })

    // ── Confirmation email ─────────────────────────────────────────────────
    // Sent AFTER the row is saved, and failures do not fail the RSVP: the
    // guest is already recorded and a retry would hit the duplicate check.
    let emailSent = false
    try {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
      const qrUrl = `${siteUrl}/api/qr/${token}`

      const htmlContent = attending
        ? attendingTicketHtml(name, count, qrUrl)
        : regretsHtml(name)

      await sendBrevoEmail({
        toEmail: email,
        toName: name,
        subject: attending
          ? 'Your RSVP is confirmed — your entry ticket is inside'
          : 'Your RSVP is confirmed',
        htmlContent,
      })
      emailSent = true
    } catch (emailError) {
      console.error('Confirmation email failed (RSVP saved):', emailError)
    }

    return NextResponse.json({ success: true, guestId: guest.Id, emailSent })
  } catch (error) {
    console.error('RSVP submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return map[ch]
  })
}

// ── Email templates ────────────────────────────────────────────────────────
// Rustic ticket in the site's wedding palette:
// cream #FAF6EF · terracotta #C1714F · sage #7D9B76 · brown #5C3D2E
// ---------------------------------------------------------------------------

const FONT_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@400;600&display=swap"
    rel="stylesheet"
  />
`

const CURSIVE = "'Great Vibes', 'Brush Script MT', 'Segoe Script', cursive"
const SANS = "'Inter', 'Segoe UI', Helvetica, Arial, sans-serif"

function ticketShell(inner: string): string {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        ${FONT_LINKS}
      </head>
      <body style="margin: 0; padding: 32px 16px; background: #FAF6EF; font-family: ${SANS}; color: #5C3D2E;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0"
                     style="max-width: 460px; width: 100%; background: #FFFDF9;
                            border: 1px solid #E7DCC8; border-radius: 12px;
                            overflow: hidden; box-shadow: 0 4px 24px rgba(92, 61, 46, 0.08);">
                ${inner}
              </table>
              <p style="margin: 20px 0 0; font-size: 12px; color: #A08B7A;">
                Manuh &amp; Anne · September 5, 2026 · CITAM Nakuru
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

function attendingTicketHtml(
  name: string,
  count: number,
  qrUrl: string
): string {
  const guest = escapeHtml(name)
  return ticketShell(`
    <tr>
      <td style="padding: 40px 32px 28px; text-align: center;">
        <p style="margin: 0 0 4px; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: #C1714F; font-family: ${SANS};">
          You are invited
        </p>
        <h1 style="margin: 0 0 16px; font-family: ${CURSIVE}; font-weight: 400;
                   font-size: 44px; line-height: 1.15; color: #5C3D2E;">
          Manuh <span style="color: #C1714F;">&amp;</span> Anne
        </h1>
        <div style="width: 44px; height: 2px; background: #C1714F; margin: 0 auto 20px;"></div>
        <p style="margin: 0 0 6px; font-size: 18px; font-weight: 600; letter-spacing: 1px;">
          Saturday, September 5, 2026
        </p>
        <p style="margin: 0 0 20px; font-size: 14px; color: #7A6A5F;">
          CITAM Nakuru · Nakuru, Kenya · 10:00 AM
        </p>
        <p style="margin: 0; font-size: 14px; color: #7A6A5F;">
          Guest
        </p>
        <p style="margin: 2px 0 0; font-size: 22px; font-weight: 600; font-family: ${SANS};">
          ${guest}
        </p>
        ${count > 0 ? `<p style="margin: 10px 0 0; font-size: 13px; color: #C1714F;">${count} seat${count === 1 ? '' : 's'} reserved</p>` : ''}
      </td>
    </tr>
    <tr>
      <td style="border-top: 2px dashed #E7DCC8;"></td>
    </tr>
    <tr>
      <td style="padding: 28px 32px 36px; text-align: center;">
        <p style="margin: 0 0 14px; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: #7D9B76; font-family: ${SANS};">
          Present this ticket at the entrance
        </p>
        <img src="${qrUrl}" alt="Your entry QR code" width="200" height="200"
             style="display: block; margin: 0 auto 16px; border: 1px solid #E7DCC8; border-radius: 8px; padding: 8px;" />
        <p style="margin: 0; font-size: 12px; color: #A08B7A;">
          If the code does not load, show this email at the door.
        </p>
      </td>
    </tr>
  `)
}

function regretsHtml(name: string): string {
  const guest = escapeHtml(name)
  return ticketShell(`
    <tr>
      <td style="padding: 40px 32px 36px; text-align: center;">
        <p style="margin: 0 0 4px; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: #C1714F; font-family: ${SANS};">
          RSVP received
        </p>
        <h1 style="margin: 0 0 16px; font-family: ${CURSIVE}; font-weight: 400;
                   font-size: 40px; line-height: 1.15; color: #5C3D2E;">
          Manuh <span style="color: #C1714F;">&amp;</span> Anne
        </h1>
        <div style="width: 44px; height: 2px; background: #C1714F; margin: 0 auto 20px;"></div>
        <p style="margin: 0; font-size: 15px; line-height: 1.6;">
          Thank you for letting us know, ${guest}.
        </p>
        <p style="margin: 12px 0 0; font-size: 14px; color: #7A6A5F; line-height: 1.6;">
          We are sorry you cannot join us — you will be missed on our special day.
        </p>
      </td>
    </tr>
  `)
}
