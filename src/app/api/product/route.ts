import { NextRequest, NextResponse } from 'next/server'

const OPEN_FOOD_FACTS_TIMEOUT_MS = Math.max(
  1000,
  Number(process.env.OPEN_FOOD_FACTS_TIMEOUT_MS ?? 12000) || 12000
)
const OPEN_FOOD_FACTS_MAX_ATTEMPTS = Math.max(
  1,
  Number(process.env.OPEN_FOOD_FACTS_MAX_ATTEMPTS ?? 3) || 3
)
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504])

function isAbortError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || (error as Error & { code?: number }).code === 20)
  )
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function parseResponseBody(response: Response) {
  const raw = await response.text()

  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw)
  } catch {
    return { error: raw }
  }
}

async function fetchOpenFoodFactsProduct(barcode: string): Promise<Response> {
  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
  let lastError: unknown = null

  for (let attempt = 1; attempt <= OPEN_FOOD_FACTS_MAX_ATTEMPTS; attempt += 1) {
    const offController = new AbortController()
    const offTimeout = setTimeout(() => offController.abort(), OPEN_FOOD_FACTS_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        signal: offController.signal,
        cache: 'no-store',
      })

      if (
        response.ok ||
        !RETRYABLE_STATUS_CODES.has(response.status) ||
        attempt === OPEN_FOOD_FACTS_MAX_ATTEMPTS
      ) {
        return response
      }

      console.warn(
        `Open Food Facts returned ${response.status} on attempt ${attempt}/${OPEN_FOOD_FACTS_MAX_ATTEMPTS}; retrying`
      )
    } catch (error) {
      lastError = error

      const isRetryableNetworkError =
        isAbortError(error) ||
        (error instanceof TypeError && error.message.toLowerCase().includes('fetch'))

      if (!isRetryableNetworkError || attempt === OPEN_FOOD_FACTS_MAX_ATTEMPTS) {
        throw error
      }

      console.warn(
        `Open Food Facts request failed on attempt ${attempt}/${OPEN_FOOD_FACTS_MAX_ATTEMPTS}; retrying`,
        error
      )
    } finally {
      clearTimeout(offTimeout)
    }

    await delay(300 * attempt)
  }

  throw lastError ?? new Error('Open Food Facts request failed without an explicit error')
}

async function formatProductWithMistral(product: any) {
  const mistralController = new AbortController()
  const mistralTimeout = setTimeout(() => mistralController.abort(), 8000)

  try {
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
        model: 'codestral-2501',
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
      signal: mistralController.signal,
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Mistral API Error:', data)
      return null
    }

    const content = data.choices[0].message.content
    const cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const formatted = JSON.parse(cleanContent)
    
    return formatted
  } catch (error) {
    console.error('Format Product Error:', error)
    return null
  } finally {
    clearTimeout(mistralTimeout)
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const barcode = searchParams.get('barcode')

  if (!barcode) {
    return NextResponse.json(
      { error: 'Barcode parameter is required' },
      { status: 400 }
    )
  }

  try {
    const response = await fetchOpenFoodFactsProduct(barcode)
    const data = await parseResponseBody(response)

    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status })
    }

    // If product found, format it with Mistral AI
    if (data.status === 1 && data.product) {
      const formatted = await formatProductWithMistral(data.product)
      if (formatted) {
        data.product.ai_formatted = formatted
      }
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Open Food Facts API Error:', error)

    if (isAbortError(error)) {
      return NextResponse.json(
        {
          error: 'Request timed out',
          message: `Open Food Facts did not respond in time after ${OPEN_FOOD_FACTS_MAX_ATTEMPTS} attempt(s). Please try again.`,
        },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Upstream fetch failed', message: error.message || 'Unknown Open Food Facts error' },
      { status: 502 }
    )
  }
}
