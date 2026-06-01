import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const result = await requireAuth(request, 'admin')

  // If requireAuth returned a NextResponse, it's a 401
  if (result instanceof NextResponse) {
    return result
  }

  return NextResponse.json({ authenticated: true, role: result.role })
}
