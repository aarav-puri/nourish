import Foundation

enum InsightKind: String, CaseIterable, Identifiable, Hashable {
    case alternatives
    case dietCompatibility = "diet_compatibility"
    case recipeSuggestions = "recipe_suggestions"
    case ecoImpact = "eco_impact"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .alternatives: "Better swaps"
        case .dietCompatibility: "Diet check"
        case .recipeSuggestions: "Recipe ideas"
        case .ecoImpact: "Footprint"
        }
    }

    var blurb: String {
        switch self {
        case .alternatives: "Healthier picks that taste alike"
        case .dietCompatibility: "Any diet, explained"
        case .recipeSuggestions: "Three ways to use it"
        case .ecoImpact: "Carbon, water, packaging"
        }
    }

    var symbol: String {
        switch self {
        case .alternatives: "arrow.left.arrow.right"
        case .dietCompatibility: "checklist"
        case .recipeSuggestions: "frying.pan"
        case .ecoImpact: "leaf"
        }
    }

    var runningLabel: String {
        switch self {
        case .alternatives: "Finding better swaps"
        case .dietCompatibility: "Checking diets"
        case .recipeSuggestions: "Writing recipes"
        case .ecoImpact: "Estimating the footprint"
        }
    }
}

struct SavedInsight: Identifiable, Hashable {
    var id: String
    var kind: InsightKind
    var content: JSONValue
    var createdAt: Date
    /// For diet checks: which diets this answer covers.
    var diets: [String]?
}

/// The prompts behind "Go further", unchanged from the web app.
enum AIService {
    private static func describe(_ food: Food) -> String {
        let n = food.nutrition
        func g(_ v: Double?) -> String { v.map { fmt($0, digits: 2) } ?? "?" }
        var header = "Product: \(food.name)"
        if let brand = food.brand { header += " by \(brand)" }
        if let quantity = food.quantity { header += " (\(quantity))" }
        return """
        \(header)
        Categories: \(food.categories ?? "Unknown")
        Ingredients: \(food.ingredientsText ?? "Not available")
        Allergens declared: \(food.allergens.isEmpty ? "None listed" : food.allergens.joined(separator: ", "))
        Nutri-Score: \(food.grade?.rawValue.uppercased() ?? "Unknown"); processing (NOVA): \(food.nova.map { String($0) } ?? "Unknown")
        Per \(food.unit): \(g(n.energyKcal)) kcal, fat \(g(n.fat))g, saturated fat \(g(n.saturatedFat))g, carbs \(g(n.carbs))g, sugars \(g(n.sugars))g, fibre \(g(n.fiber))g, protein \(g(n.protein))g, salt \(g(n.salt))g
        """
    }

    static func run(_ kind: InsightKind, food: Food, diets: [String], key: String) async throws -> JSONValue {
        let gemini = try Gemini(key: key)
        let fits = { (who: String) in diets.isEmpty ? "" : "The \(who) follows: \(diets.joined(separator: ", ")). Every suggestion must fit." }

        switch kind {
        case .alternatives:
            return try await gemini.json(
                prompt: """
                \(describe(food))
                \(fits("shopper"))

                Suggest 3 widely available, healthier alternatives in the same category with a similar flavour. Name real products or brands where you can. For each give:
                product_name, why_healthier (one sentence), flavor_similarity (1-10), price_range (e.g. "$3-5"), sugar_diff (short phrase such as "4g less sugar"), additive_diff (short phrase such as "2 fewer additives").
                Return a JSON array of 3 objects with exactly these keys.
                """,
                system: "You are a practical nutritionist who knows supermarket shelves well."
            )

        case .dietCompatibility:
            return try await gemini.json(
                prompt: """
                \(describe(food))

                Check this product against these diets: \(diets.joined(separator: ", ")).
                Return a JSON object where each diet name is a key and each value has:
                compatible ("Yes", "No" or "Maybe"), confidence (1-10), reason (one sentence), concerns (specific ingredients, or null), alternatives (a brief suggestion if not compatible, or null).
                """,
                system: "You are a careful dietitian. When ingredients are ambiguous, say Maybe rather than guess."
            )

        case .ecoImpact:
            return try await gemini.json(
                prompt: """
                \(describe(food))
                Origin: \(food.countries ?? "Unknown")
                Packaging: \(food.packaging ?? "Unknown")

                Estimate the environmental impact. Return a JSON object with:
                carbon_footprint, water_usage, transportation_impact (each "Low", "Medium" or "High"), packaging_score (1-10), overall_score (1-10, higher is better), category_comparison (one sentence versus typical products in the category), explanation (2-3 sentences), tips (array of 2-3 short tips).
                """,
                system: "You are an environmental scientist specialising in food systems."
            )

        case .recipeSuggestions:
            return try await gemini.json(
                prompt: """
                \(describe(food))
                \(diets.isEmpty ? "" : "The cook follows: \(diets.joined(separator: ", ")). Every recipe must fit.")

                Suggest 3 practical recipes that use this product as a key ingredient. For each give:
                recipe_name, description (one sentence), difficulty ("Easy", "Medium" or "Hard"), prep_time (minutes, number), calories (per serving, number), other_ingredients (array of 4-6 items), health_benefits (one sentence).
                Return a JSON array of 3 objects with exactly these keys.
                """,
                system: "You are a creative home cook and nutritionist."
            )
        }
    }
}
