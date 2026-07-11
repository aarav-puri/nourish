import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-gemini-api-key')
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing BYOK key. Add your own key in Settings.' }, { status: 401 })
    }

    const body = await request.json()

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('AI API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
