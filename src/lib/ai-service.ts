const API_URL = '/api/ai'
const MODELS = ['google/gemini-3-flash-preview', 'google/gemini-2.5-flash']
let currentModelIndex = 0

function getNextModel() {
  const model = MODELS[currentModelIndex]
  currentModelIndex = (currentModelIndex + 1) % MODELS.length
  return model
}

async function callAI(prompt: string, systemPrompt = 'You are a helpful food and nutrition assistant.') {
  const model = getNextModel()
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

export interface Product {
  product_name?: string
  name?: string
  ingredients_text?: string
  categories?: string
  countries?: string
  packaging?: string
  nutriments?: {
    energy_value?: number
    energy_unit?: string
    fat?: number
    carbohydrates?: number
    proteins?: number
    sugars?: number
    salt?: number
  }
  code?: string
  barcode?: string
}

export const aiService = {
  async getHealthierSubstitutes(product: Product) {
    const prompt = `
Product: ${product.product_name || product.name}
Ingredients: ${product.ingredients_text || 'Not available'}
Nutrition (per 100g): 
- Calories: ${product.nutriments?.energy_value || 'N/A'}
- Fat: ${product.nutriments?.fat || 'N/A'}g
- Carbs: ${product.nutriments?.carbohydrates || 'N/A'}g
- Protein: ${product.nutriments?.proteins || 'N/A'}g
- Sugar: ${product.nutriments?.sugars || 'N/A'}g

Suggest 3 healthier alternatives with similar flavor profiles. For each, provide:
1. product_name: The specific product name or brand
2. why_healthier: Why it's healthier
3. flavor_similarity: Flavor similarity (1-10)
4. price_range: Estimated price range

Format as JSON array with these exact keys.`

    return await callAI(prompt, 'You are a nutrition expert. Provide practical, realistic food substitutions. Always respond with valid JSON.')
  },

  async getMoodBasedRecommendations(mood: string, currentProduct?: Product) {
    const productContext = currentProduct ? `
Current product context:
- Product: ${currentProduct.product_name || currentProduct.name || 'Unknown'}
- Calories: ${currentProduct.nutriments?.energy_value || 'N/A'}
- Protein: ${currentProduct.nutriments?.proteins || 'N/A'}g
- Carbs: ${currentProduct.nutriments?.carbohydrates || 'N/A'}g
- Sugar: ${currentProduct.nutriments?.sugars || 'N/A'}g
` : ''

    const prompt = `
User mood: ${mood}
${productContext}

Based on this mood, recommend 3 foods that would help. For each recommendation provide:
1. food_name: Name of the food
2. why_helps: Brief explanation of why this food helps with this mood
3. key_nutrients: Main nutrients that provide the benefit
4. energy_level: How it affects energy (Boost/Sustain/Calm)

Format as JSON array with these exact keys.`

    return await callAI(prompt, 'You are a wellness and nutrition coach. Always respond with valid JSON.')
  },

  async analyzeDietCompatibility(product: Product, diets: string[]) {
    const prompt = `
Product: ${product.product_name || product.name}
Ingredients: ${product.ingredients_text || 'Not available'}
Categories: ${product.categories || 'Not available'}

Check compatibility with these diets: ${diets.join(', ')}

For each diet, provide a JSON object with these exact keys:
1. compatible: "Yes", "No", or "Maybe"
2. confidence: number 1-10
3. reason: Brief explanation
4. concerns: Specific ingredients or issues (or null if none)
5. alternatives: Brief suggestion if not compatible (or null if compatible)

Format as JSON object where each diet name is a key.`

    return await callAI(prompt, 'You are a dietary expert. Always respond with valid JSON.')
  },

  async analyzeEcoImpact(product: Product) {
    const prompt = `
Product: ${product.product_name || product.name}
Categories: ${product.categories || 'Not available'}
Origin: ${product.countries || 'Unknown'}
Packaging: ${product.packaging || 'Unknown'}

Estimate the environmental impact with these exact keys:
1. carbon_footprint: "Low", "Medium", or "High"
2. water_usage: "Low", "Medium", or "High"
3. packaging_score: number 1-10
4. transportation_impact: "Low", "Medium", or "High"
5. overall_score: number 1-10
6. explanation: Brief 2-3 sentence explanation
7. tips: Array of 2-3 eco-friendly tips

Format as JSON object with these exact keys.`

    return await callAI(prompt, 'You are an environmental sustainability expert. Always respond with valid JSON.')
  },

  async getProductSummary(product: Product) {
    const prompt = `
Product: ${product.product_name || product.name}
Ingredients: ${product.ingredients_text || 'Not available'}
Nutrition (per 100g):
- Calories: ${product.nutriments?.energy_value || 'N/A'}
- Fat: ${product.nutriments?.fat || 'N/A'}g
- Carbs: ${product.nutriments?.carbohydrates || 'N/A'}g
- Protein: ${product.nutriments?.proteins || 'N/A'}g
- Sugar: ${product.nutriments?.sugars || 'N/A'}g

Provide a brief, helpful summary including:
1. health_score: number 1-10
2. summary: 2-3 sentence overview
3. pros: Array of 2-3 positive aspects
4. cons: Array of 2-3 concerns (if any)
5. recommendation: One sentence recommendation

Format as JSON object.`

    return await callAI(prompt, 'You are a nutrition expert. Be balanced and helpful. Always respond with valid JSON.')
  },

  async getRecipeSuggestions(product: Product) {
    const prompt = `
Product: ${product.product_name || product.name}
Ingredients: ${product.ingredients_text || 'Not available'}
Categories: ${product.categories || 'Not available'}

Suggest 3 creative and practical recipes that can be made using this product as a key ingredient. For each recipe provide:
1. recipe_name: Name of the recipe
2. description: Brief 1-sentence description
3. difficulty: "Easy", "Medium", or "Hard"
4. prep_time: Estimated time in minutes
5. calories: Estimated calories per serving
6. other_ingredients: Array of 4-6 other main ingredients needed
7. health_benefits: Brief explanation of nutritional benefits

Format as JSON array with these exact keys.`

    return await callAI(prompt, 'You are a creative chef and nutritionist. Provide practical, delicious recipes. Always respond with valid JSON.')
  },
}
