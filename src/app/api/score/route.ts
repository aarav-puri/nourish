import { NextRequest, NextResponse } from 'next/server'
import { scoreProductWithGemini } from '@/lib/gemini-score'

// Scores a product the user typed in by hand, which has no published grades.
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-gemini-api-key')
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing BYOK key. Add your own key in Settings.' }, { status: 401 })
  }

  try {
    const { product } = await request.json()
    if (!product || typeof product !== 'object') {
      return NextResponse.json({ error: 'Product is required' }, { status: 400 })
    }

    await scoreProductWithGemini(product, apiKey)
    return NextResponse.json({
      nutriscore_grade: product.nutriscore_grade,
      ecoscore_grade: product.ecoscore_grade,
      ai_estimated_scores: product.ai_estimated_scores,
    })
  } catch (error: any) {
    console.error('Score API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
