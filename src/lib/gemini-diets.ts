// Server only: checks a product against diets the person typed in themselves,
// which have no built-in rule, using the caller's own Gemini key. Runs during
// the scan so the answer arrives with the product.

import { GEMINI_LITE } from '@/lib/gemini-models'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const VERDICTS = ['yes', 'no', 'maybe']

export interface DietVerdict {
  verdict: 'yes' | 'no' | 'maybe'
  reason?: string
}

/** Reads the typed-in diets the client sends: a URI-encoded JSON array of short strings. */
export function readCustomDiets(header: string | null): string[] {
  if (!header) return []
  try {
    const list = JSON.parse(decodeURIComponent(header))
    return Array.isArray(list)
      ? [...new Set(list.filter((d): d is string => typeof d === 'string').map((d) => d.trim().slice(0, 40)).filter(Boolean))].slice(0, 10)
      : []
  } catch {
    return []
  }
}

// Records a verdict for each diet on product.ai_diet_checks, keyed by the diet as typed.
export async function checkDietsWithGemini(product: any, diets: string[], apiKey: string) {
  if (!diets.length) return

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const prompt = `Does this product fit each of these diets? Judge from the ingredients only.

Product Data:
- Name: ${product.product_name || 'Unknown'}
- Categories: ${product.categories || 'Unknown'}
- Ingredients: ${product.ingredients_text || 'Not available'}
- Allergens: ${(product.allergens_tags ?? []).join(', ') || 'None listed'}

Diets: ${diets.map((d) => JSON.stringify(d)).join(', ')}

Answer "yes" if it fits, "no" if an ingredient breaks the diet, and "maybe" if the ingredients are unclear or missing.
Return JSON: {"results": [{"diet": "<diet exactly as given>", "verdict": "yes" | "no" | "maybe", "reason": "<under 12 words>"}]}`

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GEMINI_LITE,
        messages: [
          {
            role: 'system',
            content: 'You are a careful dietitian. When ingredients are ambiguous, say maybe rather than guess. Always return valid JSON only, no markdown or extra text.'
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 400,
      }),
      signal: controller.signal,
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('Gemini diet check error:', data)
      return
    }

    const content = data.choices[0].message.content
    const parsed = JSON.parse(content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim())
    const results: any[] = Array.isArray(parsed?.results) ? parsed.results : []

    const checks: Record<string, DietVerdict> = {}
    for (const diet of diets) {
      const hit = results.find((r) => typeof r?.diet === 'string' && r.diet.trim().toLowerCase() === diet.toLowerCase())
      const verdict = String(hit?.verdict ?? '').toLowerCase()
      if (!VERDICTS.includes(verdict)) continue
      checks[diet] = {
        verdict: verdict as DietVerdict['verdict'],
        reason: typeof hit.reason === 'string' ? hit.reason.trim().slice(0, 120) || undefined : undefined,
      }
    }
    if (Object.keys(checks).length) product.ai_diet_checks = checks
  } catch (error) {
    console.error('Diet Check Error:', error)
  } finally {
    clearTimeout(timeout)
  }
}
