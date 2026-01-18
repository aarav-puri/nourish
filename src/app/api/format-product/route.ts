import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { product } = await request.json()

    if (!product) {
      return NextResponse.json(
        { error: 'Product data is required' },
        { status: 400 }
      )
    }

    const prompt = `Format this product information in a clean, well-structured way. Return ONLY valid JSON with these exact fields:

Product Data:
- Name: ${product.product_name || 'Unknown'}
- Brand: ${product.brands || 'Unknown'}
- Ingredients: ${product.ingredients_text || 'Not available'}

IMPORTANT FORMATTING RULES:
1. For ingredients: Capitalize the first letter of EACH ingredient properly (e.g., "Water, Sugar, Salt" not "water, sugar, salt")
2. Keep ingredient list as comma-separated values
3. Fix any obvious typos or formatting issues in ingredients
4. Make product name and brand clean and properly capitalized

Return JSON with these exact keys:
{
  "formatted_name": "Clean product name with proper capitalization",
  "formatted_brand": "Clean brand name with proper capitalization",
  "formatted_ingredients": "Comma-separated ingredient list with EACH ingredient properly capitalized (first letter uppercase)",
  "key_highlights": ["2-3 key points about this product"]
}`

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'devstral-2501',
        messages: [
          {
            role: 'system',
            content: 'You are a product information formatter. Always return valid JSON only, no markdown or extra text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Mistral API Error:', data)
      return NextResponse.json({ error: data }, { status: response.status })
    }

    const content = data.choices[0].message.content
    // Clean up any markdown formatting
    const cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const formatted = JSON.parse(cleanContent)

    return NextResponse.json({ formatted })
  } catch (error: any) {
    console.error('Format Product API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
