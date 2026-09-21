import { NextRequest, NextResponse } from 'next/server'

const TIMEOUT_MS = Math.max(
  1000,
  Number(process.env.LOOKUP_TIMEOUT_MS ?? 12000) || 12000
)
const MAX_ATTEMPTS = Math.max(
  1,
  Number(process.env.LOOKUP_MAX_ATTEMPTS ?? 3) || 3
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

async function fetchWithRetry(
  label: string,
  url: string,
  headers?: Record<string, string>
): Promise<Response> {
  let lastError: unknown = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers,
        cache: 'no-store',
      })

      if (
        response.ok ||
        !RETRYABLE_STATUS_CODES.has(response.status) ||
        attempt === MAX_ATTEMPTS
      ) {
        return response
      }

      console.warn(`${label} returned ${response.status} on attempt ${attempt}/${MAX_ATTEMPTS}; retrying`)
    } catch (error) {
      lastError = error

      const isRetryableNetworkError =
        isAbortError(error) ||
        (error instanceof TypeError && error.message.toLowerCase().includes('fetch'))

      if (!isRetryableNetworkError || attempt === MAX_ATTEMPTS) {
        throw error
      }

      console.warn(`${label} request failed on attempt ${attempt}/${MAX_ATTEMPTS}; retrying`, error)
    } finally {
      clearTimeout(timeout)
    }

    await delay(300 * attempt)
  }

  throw lastError ?? new Error(`${label} request failed without an explicit error`)
}

// Open Food Facts is the primary source: it carries nutrition and scores.
// Resolves to null when the product is unknown.
async function lookupOpenFoodFacts(barcode: string): Promise<any | null> {
  const response = await fetchWithRetry(
    'Open Food Facts',
    `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`
  )
  if (response.status === 404) return null

  const data = await parseResponseBody(response)
  if (!response.ok) {
    throw new Error(`Open Food Facts returned ${response.status}`)
  }
  return data.status === 1 && data.product && Object.keys(data.product).length > 0
    ? data.product
    : null
}

// Go-UPC fills the gaps: broader coverage, including non-food products.
// Resolves to null when the product is unknown.
async function lookupGoUpc(barcode: string, apiKey: string): Promise<any | null> {
  const response = await fetchWithRetry(
    'Go-UPC',
    `https://go-upc.com/api/v1/code/${encodeURIComponent(barcode)}`,
    { Authorization: `Bearer ${apiKey}` }
  )
  // 400 means the code format is unrecognized, which is a plain "not found".
  if (response.status === 404 || response.status === 400) return null

  const body = await parseResponseBody(response)
  if (!response.ok) {
    throw new Error(`Go-UPC returned ${response.status}`)
  }
  return body.product ? mapGoUpcProduct(body.code, body.product) : null
}

// Go-UPC has no nutrition or score data, so those fields are simply absent.
function mapGoUpcProduct(code: string, product: any) {
  return {
    code,
    product_name: product.name,
    brands: product.brand,
    ingredients_text: product.ingredients?.text,
    image_url: product.imageUrl,
    categories: Array.isArray(product.categoryPath) && product.categoryPath.length
      ? product.categoryPath.join(', ')
      : product.category,
  }
}

function hasCoreFields(product: any) {
  return Boolean(
    product.product_name && product.brands && product.image_url && product.ingredients_text
  )
}

// Open Food Facts values win; Go-UPC only fills fields that are missing.
function mergeProducts(off: any | null, upc: any | null, barcode: string) {
  const merged: Record<string, any> = { code: barcode, ...(upc ?? {}), ...(off ?? {}) }
  for (const key of ['product_name', 'brands', 'image_url', 'ingredients_text', 'categories']) {
    if (!merged[key] && upc?.[key]) merged[key] = upc[key]
  }
  return merged
}

async function formatProductWithGemini(product: any, apiKey: string) {
  const geminiController = new AbortController()
  const geminiTimeout = setTimeout(() => geminiController.abort(), 8000)

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

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-3.5-flash-lite',
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
      signal: geminiController.signal,
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini API Error:', data)
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
    clearTimeout(geminiTimeout)
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
    let off: any | null = null
    let offError: unknown = null
    try {
      off = await lookupOpenFoodFacts(barcode)
    } catch (error) {
      // Keep going: Go-UPC may still be able to answer.
      offError = error
      console.error('Open Food Facts lookup failed:', error)
    }

    // Only spend a Go-UPC lookup when Open Food Facts left gaps.
    const goUpcKey = process.env.GO_UPC_API_KEY
    const needsGoUpc = !off || !hasCoreFields(off)
    let upc: any | null = null
    let upcError: unknown = null
    if (goUpcKey && needsGoUpc) {
      try {
        upc = await lookupGoUpc(barcode, goUpcKey)
      } catch (error) {
        upcError = error
        console.error('Go-UPC lookup failed:', error)
      }
    }

    // Both sources failed outright (as opposed to "not found").
    if (!off && !upc && offError && (upcError || !goUpcKey)) {
      throw offError
    }

    const data: { status: number; product?: any } =
      off || upc ? { status: 1, product: mergeProducts(off, upc, barcode) } : { status: 0 }

    // Formatting only runs when the browser supplied its own key.
    const apiKey = request.headers.get('x-gemini-api-key')
    if (apiKey && data.status === 1 && data.product) {
      const formatted = await formatProductWithGemini(data.product, apiKey)
      if (formatted) {
        data.product.ai_formatted = formatted
      }
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Product lookup error:', error)

    if (isAbortError(error)) {
      return NextResponse.json(
        {
          error: 'Request timed out',
          message: `Product lookup did not respond in time after ${MAX_ATTEMPTS} attempt(s). Please try again.`,
        },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Upstream fetch failed', message: error.message || 'Unknown product lookup error' },
      { status: 502 }
    )
  }
}
