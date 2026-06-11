// ---------------------------------------------------------------------------
// M-Pesa Daraja API client — OAuth, STK Push, Callback parsing, STK Query
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// TypeScript interfaces for Daraja request / response shapes
// ---------------------------------------------------------------------------

/** Parameters accepted by our initiateStkPush helper */
export interface StkPushParams {
  phoneNumber: string
  amount: number
  accountReference: string
  description: string
}

/** Payload sent to the Daraja STK Push endpoint */
export interface StkPushRequest {
  BusinessShortCode: string
  Password: string
  Timestamp: string
  TransactionType: 'CustomerPayBillOnline'
  Amount: number
  PartyA: string
  PartyB: string
  PhoneNumber: string
  CallBackURL: string
  AccountReference: string
  TransactionDesc: string
}

/** Response returned by the Daraja STK Push endpoint */
export interface StkPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

/** A single item inside CallbackMetadata.Item */
export interface CallbackMetadataItem {
  Name: string
  Value: string | number
}

/** The CallbackMetadata object */
export interface CallbackMetadata {
  Item: CallbackMetadataItem[]
}

/** The stkCallback object Safaricom POSTs to our webhook */
export interface StkCallback {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResultCode: number
  ResultDesc: string
  CallbackMetadata?: CallbackMetadata
}

/** Top-level body shape of the Safaricom callback POST */
export interface MpesaCallbackBody {
  Body: {
    stkCallback: StkCallback
  }
}

/** Normalised data extracted from a successful callback */
export interface ExtractedCallbackData {
  merchantRequestId: string
  checkoutRequestId: string
  resultCode: number
  resultDesc: string
  mpesaReceiptNumber: string | null
  amount: number | null
  transactionDate: string | null
  phoneNumber: string | null
}

/** Response from the STK Push Query endpoint */
export interface StkQueryResponse {
  ResponseCode: string
  ResponseDescription: string
  MerchantRequestID: string
  CheckoutRequestID: string
  ResultCode: string
  ResultDesc: string
}

// ---------------------------------------------------------------------------
// In-memory OAuth token cache
// ---------------------------------------------------------------------------

let cachedToken: string | null = null
let tokenExpiresAt = 0 // epoch ms

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

/** Returns the base URL for the Daraja API (sandbox or production) */
export function getMpesaBaseUrl(): string {
  const env = process.env.MPESA_ENVIRONMENT ?? 'sandbox'
  return env === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'
}

function getShortCode(): string {
  return process.env.MPESA_SHORTCODE ?? '174379'
}

function getPasskey(): string {
  const key = process.env.MPESA_PASSKEY
  if (!key) throw new Error('MPESA_PASSKEY is not configured')
  return key
}

function getConsumerCredentials(): { key: string; secret: string } {
  const key = process.env.MPESA_CONSUMER_KEY
  const secret = process.env.MPESA_CONSUMER_SECRET
  if (!key || !secret) {
    throw new Error(
      'MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET must be configured'
    )
  }
  return { key, secret }
}

function getCallbackUrl(): string {
  const url = process.env.MPESA_CALLBACK_URL
  if (!url) throw new Error('MPESA_CALLBACK_URL is not configured')
  return url
}

// ---------------------------------------------------------------------------
// OAuth token — GET with in-memory caching (240 s safety margin)
// ---------------------------------------------------------------------------

/**
 * Fetches a Daraja OAuth bearer token.
 * Results are cached in-process; a new token is fetched automatically when
 * the current one is within 240 seconds of expiry.
 */
export async function getOAuthToken(): Promise<string> {
  const now = Date.now()

  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken
  }

  const { key, secret } = getConsumerCredentials()
  const credentials = Buffer.from(`${key}:${secret}`).toString('base64')

  const url = `${getMpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${credentials}`,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Daraja OAuth error ${response.status}: ${text}`)
  }

  const data = (await response.json()) as {
    access_token: string
    expires_in: string
  }

  cachedToken = data.access_token
  // Cache until 240 s before expiry to avoid edge-case failures
  const expiresInMs = (parseInt(data.expires_in, 10) - 240) * 1000
  tokenExpiresAt = now + expiresInMs

  return cachedToken
}

// ---------------------------------------------------------------------------
// Timestamp & password helpers
// ---------------------------------------------------------------------------

/**
 * Returns the current date-time as a YYYYMMDDHHmmss string (Nairobi time).
 */
export function generateTimestamp(): string {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')

  // Format in UTC — the Daraja sandbox accepts UTC timestamps
  const y = now.getFullYear()
  const m = pad(now.getMonth() + 1)
  const d = pad(now.getDate())
  const h = pad(now.getHours())
  const min = pad(now.getMinutes())
  const s = pad(now.getSeconds())

  return `${y}${m}${d}${h}${min}${s}`
}

/**
 * Generates the Base64-encoded password required by the STK Push API.
 * Password = Base64(ShortCode + Passkey + Timestamp)
 */
export function generatePassword(timestamp: string): string {
  const shortCode = getShortCode()
  const passkey = getPasskey()
  return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64')
}

// ---------------------------------------------------------------------------
// STK Push — initiate a Lipa Na M-Pesa payment prompt
// ---------------------------------------------------------------------------

/**
 * Sends an STK Push request to the Daraja API.
 * The end-user will see a payment prompt on their phone.
 */
export async function initiateStkPush(
  params: StkPushParams
): Promise<StkPushResponse> {
  const token = await getOAuthToken()
  const timestamp = generateTimestamp()
  const shortCode = getShortCode()

  const payload: StkPushRequest = {
    BusinessShortCode: shortCode,
    Password: generatePassword(timestamp),
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: params.amount,
    PartyA: params.phoneNumber,
    PartyB: shortCode,
    PhoneNumber: params.phoneNumber,
    CallBackURL: getCallbackUrl(),
    AccountReference: params.accountReference,
    TransactionDesc: params.description,
  }

  const url = `${getMpesaBaseUrl()}/mpesa/stkpush/v1/processrequest`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Daraja STK Push error ${response.status}: ${text}`)
  }

  return (await response.json()) as StkPushResponse
}

// ---------------------------------------------------------------------------
// Callback parser — extract meaningful data from the Safaricom POST
// ---------------------------------------------------------------------------

/**
 * Parses the raw Safaricom callback body and extracts normalised fields.
 * Works for both successful (ResultCode 0) and failed transactions.
 */
export function extractCallbackData(
  body: MpesaCallbackBody
): ExtractedCallbackData {
  const cb = body.Body.stkCallback

  let mpesaReceiptNumber: string | null = null
  let amount: number | null = null
  let transactionDate: string | null = null
  let phoneNumber: string | null = null

  if (cb.ResultCode === 0 && cb.CallbackMetadata) {
    for (const item of cb.CallbackMetadata.Item) {
      switch (item.Name) {
        case 'MpesaReceiptNumber':
          mpesaReceiptNumber = String(item.Value)
          break
        case 'Amount':
          amount = Number(item.Value)
          break
        case 'TransactionDate':
          transactionDate = String(item.Value)
          break
        case 'PhoneNumber':
          phoneNumber = String(item.Value)
          break
      }
    }
  }

  return {
    merchantRequestId: cb.MerchantRequestID,
    checkoutRequestId: cb.CheckoutRequestID,
    resultCode: cb.ResultCode,
    resultDesc: cb.ResultDesc,
    mpesaReceiptNumber,
    amount,
    transactionDate,
    phoneNumber,
  }
}

// ---------------------------------------------------------------------------
// STK Query — poll Daraja for the status of a previous STK Push
// ---------------------------------------------------------------------------

/**
 * Queries the Daraja STK Push Query API for the status of a transaction.
 * Useful as a fallback when the callback is delayed or lost.
 */
export async function queryStkPushStatus(
  checkoutRequestId: string
): Promise<StkQueryResponse> {
  const token = await getOAuthToken()
  const timestamp = generateTimestamp()
  const shortCode = getShortCode()

  const payload = {
    BusinessShortCode: shortCode,
    Password: generatePassword(timestamp),
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  }

  const url = `${getMpesaBaseUrl()}/mpesa/stkpushquery/v1/query`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Daraja STK Query error ${response.status}: ${text}`)
  }

  return (await response.json()) as StkQueryResponse
}
