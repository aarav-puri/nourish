// Server only: estimates the grades a product record is missing, using the
// caller's own Gemini key. Published grades are never overwritten.

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const SCORE_MODEL = 'gemini-3.5-flash-lite'
const VALID_GRADES = ['a', 'b', 'c', 'd', 'e']

export function needsScoring(product: any) {
  return !isValidGrade(product?.nutriscore_grade) || !isValidGrade(product?.ecoscore_grade)
}

function isValidGrade(grade: unknown): grade is string {
  return typeof grade === 'string' && VALID_GRADES.includes(grade.toLowerCase())
}

// Fills nutriscore_grade and ecoscore_grade in place when they are missing,
// and records which ones were estimated so the UI can label them.
export async function scoreProductWithGemini(product: any, apiKey: string) {
  if (!needsScoring(product)) return

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const n = product.nutriments ?? {}
    const prompt = `Estimate the Nutri-Score and Eco-Score grades for this product from the data given.

Product Data:
- Name: ${product.product_name || 'Unknown'}
- Brand: ${product.brands || 'Unknown'}
- Categories: ${product.categories || 'Unknown'}
- Ingredients: ${product.ingredients_text || 'Not available'}
- Packaging: ${product.packaging || 'Unknown'}
- Per 100g: energy ${n.energy_value ?? n['energy-kcal_100g'] ?? '?'} ${n.energy_unit || 'kcal'}, fat ${n.fat ?? '?'}g, saturated fat ${n['saturated-fat'] ?? '?'}g, sugars ${n.sugars ?? '?'}g, salt ${n.salt ?? '?'}g, fiber ${n.fiber ?? '?'}g, protein ${n.proteins ?? '?'}g

Use the official Nutri-Score and Eco-Score methods as closely as the data allows. Grades are a (best) to e (worst).
If the item is not food or drink, or there is too little information to judge, use null.

Return JSON with these exact keys:
{
  "nutriscore_grade": "a" | "b" | "c" | "d" | "e" | null,
  "ecoscore_grade": "a" | "b" | "c" | "d" | "e" | null
}`

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: SCORE_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a food scoring assistant. Always return valid JSON only, no markdown or extra text.'
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 100,
      }),
      signal: controller.signal,
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('Gemini scoring error:', data)
      return
    }

    const content = data.choices[0].message.content
    const parsed = JSON.parse(content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim())

    const estimated: string[] = []
    for (const key of ['nutriscore_grade', 'ecoscore_grade']) {
      if (!isValidGrade(product[key]) && isValidGrade(parsed[key])) {
        product[key] = parsed[key].toLowerCase()
        estimated.push(key)
      }
    }
    if (estimated.length) product.ai_estimated_scores = estimated
  } catch (error) {
    console.error('Score Product Error:', error)
  } finally {
    clearTimeout(timeout)
  }
}
