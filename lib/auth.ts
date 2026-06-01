import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SessionRole = 'admin' | 'usher'

export interface SessionPayload extends JWTPayload {
  role: SessionRole
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ADMIN_COOKIE = 'admin_session'
const USHER_COOKIE = 'usher_session'
const TOKEN_EXPIRY = '24h'
const ALGORITHM = 'HS256'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSecret(role: SessionRole): Uint8Array {
  const envKey = role === 'admin' ? 'ADMIN_SECRET' : 'USHER_SECRET'
  const raw = process.env[envKey]
  if (!raw) {
    throw new Error(`${envKey} environment variable is not set`)
  }
  return new TextEncoder().encode(raw)
}

function getCookieName(role: SessionRole): string {
  return role === 'admin' ? ADMIN_COOKIE : USHER_COOKIE
}

// ---------------------------------------------------------------------------
// Sign — create a new JWT for the given role
// ---------------------------------------------------------------------------

export async function signSessionToken(role: SessionRole): Promise<string> {
  const secret = getSecret(role)
  return new SignJWT({ role })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret)
}

// ---------------------------------------------------------------------------
// Verify — decode & validate a JWT, return the payload or null
// ---------------------------------------------------------------------------

export async function verifySessionToken(
  token: string,
  role: SessionRole
): Promise<SessionPayload | null> {
  try {
    const secret = getSecret(role)
    const { payload } = await jwtVerify(token, secret)
    if ((payload as SessionPayload).role !== role) return null
    return payload as SessionPayload
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Cookie helpers — set / clear session cookies
// ---------------------------------------------------------------------------

export function setSessionCookie(
  response: NextResponse,
  role: SessionRole,
  token: string
): void {
  response.cookies.set(getCookieName(role), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })
}

export function clearSessionCookie(
  response: NextResponse,
  role: SessionRole
): void {
  response.cookies.set(getCookieName(role), '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

// ---------------------------------------------------------------------------
// Request guard — verify the caller is authenticated for a given role.
// Returns the payload on success or a 401 NextResponse on failure.
// ---------------------------------------------------------------------------

export async function requireAuth(
  request: NextRequest,
  role: SessionRole
): Promise<SessionPayload | NextResponse> {
  const cookieName = getCookieName(role)
  const token = request.cookies.get(cookieName)?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await verifySessionToken(token, role)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return payload
}

// ---------------------------------------------------------------------------
// Server Component helper — check auth from a Server Component via cookies()
// ---------------------------------------------------------------------------

export async function getServerSession(
  role: SessionRole
): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(getCookieName(role))?.value
  if (!token) return null
  return verifySessionToken(token, role)
}
