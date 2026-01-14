// AI Service
class AIService {
  constructor() {
    this.apiUrl = CONFIG.OPENROUTER_API_URL;
    this.model = CONFIG.MODEL;
  }

  async callAI(
    prompt,
    systemPrompt = "You are a helpful food and nutrition assistant."
  ) {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API error: ${response.status} - ${
            errorData.error || "Unknown error"
          }`
        );
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("AI Service Error:", error);
      throw error;
    }
  }

  // Ingredient Substitution
  async getHealthierSubstitutes(product) {
    const prompt = `
Product: ${product.product_name}
Ingredients: ${product.ingredients_text || "Not available"}
Nutrition (per 100g): 
- Calories: ${product.nutriments?.energy_value || "N/A"}
- Fat: ${product.nutriments?.fat || "N/A"}g
- Carbs: ${product.nutriments?.carbohydrates || "N/A"}g
- Protein: ${product.nutriments?.proteins || "N/A"}g
- Sugar: ${product.nutriments?.sugars || "N/A"}g

Suggest 3 healthier alternatives with similar flavor profiles. For each, provide:
1. product_name: The specific product name or brand
2. why_it_s_healthier: Why it's healthier
3. flavor_similarity: Flavor similarity (1-10)
4. estimated_price_range: Estimated price range

Format as JSON array with these exact keys. Make sure product_name contains the actual product name, not just a category.`;

    return await this.callAI(
      prompt,
      "You are a nutrition expert. Provide practical, realistic food substitutions."
    );
  }

  // Mood-Based Recommendations
  async getMoodBasedRecommendations(mood, currentProduct) {
    const prompt = `
User mood: ${mood}
Current product nutrition:
- Calories: ${currentProduct.nutriments?.energy_value || "N/A"}
- Protein: ${currentProduct.nutriments?.proteins || "N/A"}g
- Carbs: ${currentProduct.nutriments?.carbohydrates || "N/A"}g
- Sugar: ${currentProduct.nutriments?.sugars || "N/A"}g

Based on this mood, recommend 3 foods that would help. For each recommendation provide:
1. food_name: Name of the food
2. why_it_helps: Brief explanation of why this food helps with this mood
3. key_nutrients: Main nutrients that provide the benefit
4. energy_level: How it affects energy (Boost/Sustain/Calm)

Format as JSON array with these exact keys.`;

    return await this.callAI(
      prompt,
      "You are a wellness and nutrition coach. Always respond with valid JSON."
    );
  }

  // Diet Compatibility Analysis
  async analyzeDietCompatibility(product, diets) {
    const prompt = `
Product: ${product.product_name}
Ingredients: ${product.ingredients_text || "Not available"}
Categories: ${product.categories || "Not available"}

Check compatibility with these diets: ${diets.join(", ")}

For each diet, provide a JSON object with these exact keys:
1. compatible: "Yes", "No", or "Maybe"
2. confidence: number 1-10 (how confident you are)
3. reason: Brief explanation why it is/isn't compatible
4. concerns: Specific ingredients or issues (or null if none)
5. alternatives: Brief suggestion if not compatible (or null if compatible)

Format as JSON object where each diet name is a key with the above structure as value.

Example format:
{
  "Vegan": {
    "compatible": "No",
    "confidence": 10,
    "reason": "Contains milk and eggs",
    "concerns": "Dairy products, egg whites",
    "alternatives": "Look for plant-based versions with almond or oat milk"
  }
}`;

    return await this.callAI(
      prompt,
      "You are a dietary expert familiar with various diet restrictions. Always respond with valid JSON."
    );
  }

  // Eco Score Analysis
  async analyzeEcoImpact(product) {
    const prompt = `
Product: ${product.product_name}
Categories: ${product.categories || "Not available"}
Origin: ${product.countries || "Unknown"}
Packaging: ${product.packaging || "Unknown"}

Estimate the environmental impact with these exact keys:
1. carbon_footprint: "Low", "Medium", or "High"
2. water_usage: "Low", "Medium", or "High"
3. packaging_sustainability_score: number 1-10
4. transportation_impact: "Low", "Medium", or "High"
5. overall_eco_score: number 1-10
6. explanation: Brief 2-3 sentence explanation
7. tips: Array of 2-3 eco-friendly tips

Format as JSON object with these exact keys.`;

    return await this.callAI(
      prompt,
      "You are an environmental sustainability expert. Always respond with valid JSON."
    );
  }

  // Smart Query Processing
  async processVoiceQuery(query, context = {}) {
    const prompt = `
User query: "${query}"
Context: ${JSON.stringify(context)}

Interpret this query and provide:
1. Intent (what the user wants)
2. Suggested search terms or filters
3. Helpful response

Format as JSON object.`;

    return await this.callAI(prompt, "You are a helpful shopping assistant.");
  }
}

// Initialize AI service
const aiService = new AIService();
