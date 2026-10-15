import type { Food } from '@/lib/food'

const API_URL = '/api/ai'
const MODEL = 'gemini-3.8-flash'
const API_KEY_STORAGE_KEY = 'gemini_api_key'

export function getGeminiApiKey() {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function setGeminiApiKey(key: string) {
  if (typeof window === 'undefined') return
  if (key) localStorage.setItem(API_KEY_STORAGE_KEY, key)
  else localStorage.removeItem(API_KEY_STORAGE_KEY)
}

/** Shows the first and last few characters so a person can tell which key is saved. */
export function maskKey(key: string) {
  if (key.length <= 10) return '•'.repeat(key.length)
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`
}

export class AIError extends Error {
  constructor(message: string, public code: 'missing_key' | 'bad_key' | 'rate_limited' | 'failed') {
    super(message)
  }
}

async function callAI(prompt: string, systemPrompt: string) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) throw new AIError('Add your Gemini key in Settings to use AI insights.', 'missing_key')

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': apiKey },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: `${systemPrompt} Respond with valid JSON only, no markdown.` },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 8000,
    }),
  })

  if (!response.ok) {
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      throw new AIError('Google rejected your Gemini key. Check it in Settings.', 'bad_key')
    }
    if (response.status === 429) {
      throw new AIError('Your Gemini key hit its rate limit. Wait a minute and try again.', 'rate_limited')
    }
    throw new AIError('The AI did not respond. Try again.', 'failed')
  }

  const data = await response.json()
  return parseJSON(data?.choices?.[0]?.message?.content ?? '')
}

/** Models sometimes wrap JSON in fences or prose; take the outermost object or array. */
function parseJSON(text: string) {
  const clean = text.replace(/```(?:json)?/g, '').trim()
  try {
    return JSON.parse(clean)
  } catch {
    const start = clean.search(/[[{]/)
    const end = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'))
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(clean.slice(start, end + 1))
      } catch {
        /* fall through */
      }
    }
    throw new AIError('The AI returned something we could not read. Try again.', 'failed')
  }
}

function describe(food: Food) {
  const n = food.nutrition
  return `Product: ${food.name}${food.brand ? ` by ${food.brand}` : ''}${food.quantity ? ` (${food.quantity})` : ''}
Categories: ${food.categories || 'Unknown'}
Ingredients: ${food.ingredientsText || 'Not available'}
Allergens declared: ${food.allergens.join(', ') || 'None listed'}
Nutri-Score: ${food.grade?.toUpperCase() ?? 'Unknown'}; processing (NOVA): ${food.nova ?? 'Unknown'}
Per 100${food.isBeverage ? 'ml' : 'g'}: ${n.energyKcal ?? '?'} kcal, fat ${n.fat ?? '?'}g, saturated fat ${n.saturatedFat ?? '?'}g, carbs ${n.carbs ?? '?'}g, sugars ${n.sugars ?? '?'}g, fibre ${n.fiber ?? '?'}g, protein ${n.protein ?? '?'}g, salt ${n.salt ?? '?'}g`
}

export type InsightKind = 'alternatives' | 'diet_compatibility' | 'eco_impact' | 'recipe_suggestions'

export const INSIGHT_TITLES: Record<InsightKind, string> = {
  alternatives: 'Better swaps',
  diet_compatibility: 'Diet check',
  eco_impact: 'Footprint',
  recipe_suggestions: 'Recipe ideas',
}

export const aiService = {
  getHealthierSubstitutes(food: Food, diets: string[] = []) {
    return callAI(
      `${describe(food)}
${diets.length ? `The shopper follows: ${diets.join(', ')}. Every suggestion must fit.` : ''}

Suggest 3 widely available, healthier alternatives in the same category with a similar flavour. Name real products or brands where you can. For each give:
product_name, why_healthier (one sentence), flavor_similarity (1-10), price_range (e.g. "$3-5"), sugar_diff (short phrase such as "4g less sugar"), additive_diff (short phrase such as "2 fewer additives").
Return a JSON array of 3 objects with exactly these keys.`,
      'You are a practical nutritionist who knows supermarket shelves well.'
    )
  },

  analyzeDietCompatibility(food: Food, diets: string[]) {
    return callAI(
      `${describe(food)}

Check this product against these diets: ${diets.join(', ')}.
Return a JSON object where each diet name is a key and each value has:
compatible ("Yes", "No" or "Maybe"), confidence (1-10), reason (one sentence), concerns (specific ingredients, or null), alternatives (a brief suggestion if not compatible, or null).`,
      'You are a careful dietitian. When ingredients are ambiguous, say Maybe rather than guess.'
    )
  },

  analyzeEcoImpact(food: Food) {
    return callAI(
      `${describe(food)}
Origin: ${food.countries || 'Unknown'}
Packaging: ${food.packaging || 'Unknown'}

Estimate the environmental impact. Return a JSON object with:
carbon_footprint, water_usage, transportation_impact (each "Low", "Medium" or "High"), packaging_score (1-10), overall_score (1-10, higher is better), category_comparison (one sentence versus typical products in the category), explanation (2-3 sentences), tips (array of 2-3 short tips).`,
      'You are an environmental scientist specialising in food systems.'
    )
  },

  getRecipeSuggestions(food: Food, diets: string[] = []) {
    return callAI(
      `${describe(food)}
${diets.length ? `The cook follows: ${diets.join(', ')}. Every recipe must fit.` : ''}

Suggest 3 practical recipes that use this product as a key ingredient. For each give:
recipe_name, description (one sentence), difficulty ("Easy", "Medium" or "Hard"), prep_time (minutes, number), calories (per serving, number), other_ingredients (array of 4-6 items), health_benefits (one sentence).
Return a JSON array of 3 objects with exactly these keys.`,
      'You are a creative home cook and nutritionist.'
    )
  },
}
