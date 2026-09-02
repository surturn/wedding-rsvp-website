// ---------------------------------------------------------------------------
// Brevo (Sendinblue) transactional email helper
// ---------------------------------------------------------------------------
// Replaces the n8n email node. n8n's Railway service had no volume, so its
// workflows and credentials were wiped on restart — the app now owns sending.
// ---------------------------------------------------------------------------

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

export interface BrevoEmailParams {
  toEmail: string
  toName?: string
  subject: string
  htmlContent: string
}

export async function sendBrevoEmail(
  params: BrevoEmailParams
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL
  const senderName = process.env.BREVO_SENDER_NAME || 'Invonics Technologies'

  if (!apiKey || !senderEmail) {
    throw new Error('BREVO_API_KEY / BREVO_SENDER_EMAIL are not configured')
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: params.toEmail, name: params.toName || params.toEmail }],
      subject: params.subject,
      htmlContent: params.htmlContent,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Brevo send error ${response.status}: ${text}`)
  }
}
