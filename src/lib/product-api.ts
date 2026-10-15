import { getGeminiApiKey } from '@/lib/ai-service'

export interface ProductData {
  status: number
  product?: Record<string, any>
}

export class LookupError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

export async function fetchProductInfo(barcode: string, signal?: AbortSignal): Promise<ProductData> {
  const response = await fetch(`/api/product?barcode=${encodeURIComponent(barcode)}`, {
    headers: { 'x-gemini-api-key': getGeminiApiKey() },
    signal,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message =
      response.status === 504
        ? 'The product database is slow to respond. Try again in a moment.'
        : body.error || 'We could not look that product up.'
    throw new LookupError(message, response.status)
  }

  return response.json()
}

// Estimates the missing grades for a product entered by hand.
export async function scoreProduct(product: Record<string, any>) {
  const response = await fetch('/api/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': getGeminiApiKey() },
    body: JSON.stringify({ product }),
  })

  if (!response.ok) {
    throw new Error('Failed to score product')
  }

  return response.json() as Promise<{
    nutriscore_grade?: string
    ecoscore_grade?: string
    ai_estimated_scores?: string[]
  }>
}
