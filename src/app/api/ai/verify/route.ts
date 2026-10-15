import { NextRequest, NextResponse } from 'next/server'

// Confirms a Gemini key works by listing one model: free, and it does not
// spend any of the person's generation quota.
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-gemini-api-key')
  if (!apiKey) return NextResponse.json({ status: 'invalid' }, { status: 400 })

  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', {
      headers: { 'x-goog-api-key': apiKey },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) return NextResponse.json({ status: 'ok' })
    if ([400, 401, 403].includes(res.status)) return NextResponse.json({ status: 'invalid' })
    return NextResponse.json({ status: 'unreachable' })
  } catch {
    return NextResponse.json({ status: 'unreachable' })
  }
}
