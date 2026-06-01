// ---------------------------------------------------------------------------
// Shared NocoDB client helpers & Guest type definition
// ---------------------------------------------------------------------------

export interface Guest {
  Id: number
  name: string
  phone: string
  Email: string
  attending: boolean
  guestCount: number
  message: string
  Token: string
  CheckedIn: boolean
  CheckedInAt: string | null
  QRCode: string | null
  CreatedAt: string
}

export interface NocoDB_ListResponse {
  list: Record<string, unknown>[]
  pageInfo: {
    totalRows: number
    page: number
    pageSize: number
    isFirstPage: boolean
    isLastPage: boolean
  }
}

const NOCODB_BASE_URL =
  'https://nocodb-production-54ae.up.railway.app/api/v1/db/data/v1/Guests/Guests'

function getNocoToken(): string {
  const token = process.env.NOCODB_API_TOKEN
  if (!token) throw new Error('NOCODB_API_TOKEN is not configured')
  return token
}

function nocoHeaders(): HeadersInit {
  return {
    'xc-token': getNocoToken(),
    'Content-Type': 'application/json',
  }
}

// ---------------------------------------------------------------------------
// Normalise a raw NocoDB row into our Guest interface
// ---------------------------------------------------------------------------

export function normaliseGuest(raw: Record<string, unknown>): Guest {
  return {
    Id: (raw.Id ?? raw.id ?? 0) as number,
    name: (raw.name ?? raw.Name ?? '') as string,
    phone: (raw.phone ?? raw.Phone ?? '') as string,
    Email: (raw.Email ?? raw.email ?? '') as string,
    attending:
      raw.attending === true ||
      raw.attending === 'true' ||
      raw.Attending === true,
    guestCount: Number(
      raw.guestCount ?? raw.GuestCount ?? raw.guest_count ?? 0
    ),
    message: (raw.message ?? raw.Message ?? '') as string,
    Token: (raw.Token ?? raw.token ?? '') as string,
    CheckedIn:
      raw.CheckedIn === true || raw.CheckedIn === 1,
    CheckedInAt: (raw.CheckedInAt ?? null) as string | null,
    QRCode: (raw.QRCode ?? null) as string | null,
    CreatedAt: (raw.CreatedAt ?? raw.created_at ?? new Date().toISOString()) as string,
  }
}

// ---------------------------------------------------------------------------
// Fetch all guests (optionally with a NocoDB `where` filter)
// ---------------------------------------------------------------------------

export async function fetchGuests(
  where?: string
): Promise<Guest[]> {
  const url = new URL(NOCODB_BASE_URL)
  url.searchParams.set('limit', '1000')
  if (where) {
    url.searchParams.set('where', where)
  }

  const response = await fetch(url.toString(), {
    headers: nocoHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`NocoDB GET error ${response.status}: ${text}`)
  }

  const data = (await response.json()) as NocoDB_ListResponse
  return (data.list || []).map(normaliseGuest)
}

// ---------------------------------------------------------------------------
// Fetch a single guest by NocoDB row ID
// ---------------------------------------------------------------------------

export async function fetchGuestById(id: number): Promise<Guest | null> {
  const url = `${NOCODB_BASE_URL}/${id}`

  const response = await fetch(url, {
    headers: nocoHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    if (response.status === 404) return null
    const text = await response.text()
    throw new Error(`NocoDB GET error ${response.status}: ${text}`)
  }

  const raw = (await response.json()) as Record<string, unknown>
  return normaliseGuest(raw)
}

// ---------------------------------------------------------------------------
// Fetch a single guest by Token field
// ---------------------------------------------------------------------------

export async function fetchGuestByToken(token: string): Promise<Guest | null> {
  const guests = await fetchGuests(`(Token,eq,${token})`)
  return guests.length > 0 ? guests[0] : null
}

// ---------------------------------------------------------------------------
// Patch a guest row in NocoDB
// ---------------------------------------------------------------------------

export async function patchGuest(
  id: number,
  fields: Record<string, unknown>
): Promise<void> {
  const url = `${NOCODB_BASE_URL}/${id}`

  const response = await fetch(url, {
    method: 'PATCH',
    headers: nocoHeaders(),
    body: JSON.stringify(fields),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`NocoDB PATCH error ${response.status}: ${text}`)
  }
}
