import { getGeminiApiKey } from '@/lib/ai-service'

export interface ProductData {
  status: number
  product?: {
    code?: string
    product_name?: string
    brands?: string
    quantity?: string
    categories?: string
    ingredients_text?: string
    image_url?: string
    nutriments?: {
      energy_value?: number
      energy_unit?: string
      fat?: number
      carbohydrates?: number
      proteins?: number
      sugars?: number
      salt?: number
    }
    countries?: string
    packaging?: string
    nutriscore_grade?: string
    ecoscore_grade?: string
    ai_estimated_scores?: string[]
    ai_formatted?: {
      formatted_name?: string
      formatted_brand?: string
      formatted_ingredients?: string
      key_highlights?: string[]
    }
  }
}

export async function fetchProductInfo(barcode: string): Promise<ProductData> {
  const response = await fetch(`/api/product?barcode=${barcode}`, {
    headers: { 'x-gemini-api-key': getGeminiApiKey() },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch product information')
  }
  
  return response.json()
}

// Estimates the missing grades for a product entered by hand.
export async function scoreProduct(product: NonNullable<ProductData['product']>) {
  const response = await fetch('/api/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': getGeminiApiKey() },
    body: JSON.stringify({ product }),
  })

  if (!response.ok) {
    throw new Error('Failed to score product')
  }

  return response.json() as Promise<
    Pick<NonNullable<ProductData['product']>, 'nutriscore_grade' | 'ecoscore_grade' | 'ai_estimated_scores'>
  >
}

export function getNutriScoreColor(grade?: string): string {
  const colors: Record<string, string> = {
    a: 'bg-green-500',
    b: 'bg-lime-500',
    c: 'bg-yellow-500',
    d: 'bg-orange-500',
    e: 'bg-red-500',
  }
  return colors[grade?.toLowerCase() || ''] || 'bg-zinc-500'
}

export function getEcoScoreColor(grade?: string): string {
  const colors: Record<string, string> = {
    a: 'bg-green-500',
    b: 'bg-lime-500',
    c: 'bg-yellow-500',
    d: 'bg-orange-500',
    e: 'bg-red-500',
  }
  return colors[grade?.toLowerCase() || ''] || 'bg-zinc-500'
}
