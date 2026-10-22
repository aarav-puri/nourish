import Foundation

enum Diet: String, CaseIterable, Identifiable, Hashable {
    case vegetarian, vegan, pescatarian
    case glutenFree = "gluten-free"
    case dairyFree = "dairy-free"
    case halal, kosher, keto
    case lowSugar = "low-sugar"
    case lowSalt = "low-salt"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .vegetarian: "Vegetarian"
        case .vegan: "Vegan"
        case .pescatarian: "Pescatarian"
        case .glutenFree: "Gluten-free"
        case .dairyFree: "Dairy-free"
        case .halal: "Halal"
        case .kosher: "Kosher"
        case .keto: "Keto"
        case .lowSugar: "Low sugar"
        case .lowSalt: "Low salt"
        }
    }

    var hint: String {
        switch self {
        case .vegetarian: "No meat or fish"
        case .vegan: "No animal products"
        case .pescatarian: "Fish, no meat"
        case .glutenFree: "No wheat, barley or rye"
        case .dairyFree: "No milk products"
        case .halal: "No pork or alcohol"
        case .kosher: "Certified kosher"
        case .keto: "Very low carbohydrate"
        case .lowSugar: "Flags high-sugar foods"
        case .lowSalt: "Flags high-salt foods"
        }
    }

    var symbol: String {
        switch self {
        case .vegetarian: "carrot"
        case .vegan: "leaf"
        case .pescatarian: "fish"
        case .glutenFree: "laurel.leading"
        case .dairyFree: "drop"
        case .halal: "moon.stars"
        case .kosher: "star"
        case .keto: "flame"
        case .lowSugar: "cube"
        case .lowSalt: "aqi.low"
        }
    }
}

/// A person's food profile: the diets they follow and the allergens they
/// avoid. It lives in Supabase auth user metadata, so it follows the account
/// to every device without a schema change.
struct FoodProfile: Hashable {
    var diets: [Diet] = []
    var avoid: [String] = []

    var isEmpty: Bool { diets.isEmpty && avoid.isEmpty }

    init(diets: [Diet] = [], avoid: [String] = []) {
        self.diets = diets
        self.avoid = avoid
    }

    init(metadata: JSONValue?) {
        let raw = metadata?["food_profile"]
        diets = (raw?["diets"]?.stringArray ?? []).compactMap(Diet.init(rawValue:))
        avoid = raw?["avoid"]?.stringArray ?? []
    }

    var json: JSONValue {
        ["diets": JSONValue(diets.map(\.rawValue)), "avoid": JSONValue(avoid)]
    }
}

// MARK: - Checking a product against a profile

enum CheckStatus: Int, Comparable {
    case conflict = 0, caution, unknown, ok

    static func < (lhs: CheckStatus, rhs: CheckStatus) -> Bool { lhs.rawValue < rhs.rawValue }
}

struct ProfileCheck: Identifiable, Hashable {
    let id: String
    let status: CheckStatus
    let title: String
    var detail: String? = nil
}

/// Compares a product to the profile using only what the record states:
/// declared allergens and traces, the database's ingredient analysis, nutrient
/// levels, certification labels and, as a fallback, the ingredient text.
/// When the record cannot settle a question the answer is "unknown", never a
/// guess.
func checkProduct(_ food: Food, against profile: FoodProfile) -> [ProfileCheck] {
    var checks: [ProfileCheck] = []
    let hasIngredients = !food.ingredients.isEmpty
    func has(_ id: String) -> Bool { food.allergens.contains(id) }
    func mayHave(_ id: String) -> Bool { food.traces.contains(id) }
    func ingredientMatch(_ pattern: Pattern) -> String? {
        food.ingredientsText.flatMap { pattern.match(in: $0)?.lowercased() }
    }

    for id in profile.avoid {
        let label = Allergen.label(for: id)
        if has(id) {
            checks.append(.init(id: "a-\(id)", status: .conflict, title: "Contains \(label.lowercased())"))
        } else if mayHave(id) {
            checks.append(.init(id: "a-\(id)", status: .caution, title: "May contain \(label.lowercased())", detail: "Listed as a trace"))
        } else if !food.allergens.isEmpty || hasIngredients {
            checks.append(.init(id: "a-\(id)", status: .ok, title: "No \(label.lowercased()) declared"))
        } else {
            checks.append(.init(id: "a-\(id)", status: .unknown, title: "\(label): no allergen data"))
        }
    }

    for diet in profile.diets {
        let key = diet.rawValue
        switch diet {
        case .vegan:
            let hit = ingredientMatch(meatFishPattern) ?? ingredientMatch(animalProductPattern)
            if food.vegan == .no || has("milk") || has("eggs") || has("fish") || has("crustaceans") {
                checks.append(.init(id: key, status: .conflict, title: "Not vegan", detail: hit.map { "Contains \($0)" }))
            } else if food.vegan == .maybe {
                checks.append(.init(id: key, status: .caution, title: "May not be vegan", detail: "Some ingredients are unclear"))
            } else if food.vegan == .yes {
                checks.append(.init(id: key, status: .ok, title: "Vegan"))
            } else if let hit {
                checks.append(.init(id: key, status: .conflict, title: "Not vegan", detail: "Contains \(hit)"))
            } else {
                checks.append(.init(id: key, status: hasIngredients ? .ok : .unknown, title: hasIngredients ? "Looks vegan" : "Vegan: not enough data"))
            }

        case .vegetarian, .pescatarian:
            let label = diet == .vegetarian ? "vegetarian" : "pescatarian"
            let fishOK = diet == .pescatarian
            let raw = ingredientMatch(meatFishPattern)
            let isFish = raw.map { Pattern("fish|tuna|salmon|anchov|shrimp|prawn|crab|lobster").test($0) } ?? false
            let hit = fishOK && isFish ? nil : raw
            if (food.vegetarian == .no && !fishOK) || hit != nil {
                checks.append(.init(id: key, status: .conflict, title: "Not \(label)", detail: hit.map { "Contains \($0)" }))
            } else if food.vegetarian == .maybe {
                checks.append(.init(id: key, status: .caution, title: "May not be \(label)", detail: "Some ingredients are unclear"))
            } else if food.vegetarian == .yes || hasIngredients {
                checks.append(.init(id: key, status: .ok, title: food.vegetarian == .yes ? diet.label : "Looks \(label)"))
            } else {
                checks.append(.init(id: key, status: .unknown, title: "\(diet.label): not enough data"))
            }

        case .glutenFree:
            if food.labels.contains("no-gluten") || food.labels.contains("gluten-free") {
                checks.append(.init(id: key, status: .ok, title: "Certified gluten-free"))
            } else if has("gluten") {
                checks.append(.init(id: key, status: .conflict, title: "Contains gluten"))
            } else if mayHave("gluten") {
                checks.append(.init(id: key, status: .caution, title: "May contain gluten"))
            } else {
                checks.append(.init(id: key, status: hasIngredients ? .ok : .unknown, title: hasIngredients ? "No gluten declared" : "Gluten: no data"))
            }

        case .dairyFree:
            if has("milk") {
                checks.append(.init(id: key, status: .conflict, title: "Contains milk"))
            } else if mayHave("milk") {
                checks.append(.init(id: key, status: .caution, title: "May contain milk"))
            } else {
                checks.append(.init(id: key, status: hasIngredients ? .ok : .unknown, title: hasIngredients ? "No dairy declared" : "Dairy: no data"))
            }

        case .halal:
            if food.labels.contains("halal") {
                checks.append(.init(id: key, status: .ok, title: "Certified halal"))
            } else if let hit = ingredientMatch(notHalalPattern) {
                checks.append(.init(id: key, status: .conflict, title: "May not be halal", detail: "Contains \(hit)"))
            } else {
                checks.append(.init(id: key, status: .unknown, title: "Not certified halal", detail: "No obvious conflicts in the ingredients"))
            }

        case .kosher:
            if food.labels.contains(where: { $0.contains("kosher") }) {
                checks.append(.init(id: key, status: .ok, title: "Certified kosher"))
            } else {
                checks.append(.init(id: key, status: .unknown, title: "No kosher certification listed"))
            }

        case .keto:
            if let carbs = food.nutrition.carbs {
                if carbs > 10 {
                    checks.append(.init(id: key, status: .conflict, title: "Too many carbs for keto", detail: "\(fmt(carbs))g per 100g"))
                } else if carbs > 5 {
                    checks.append(.init(id: key, status: .caution, title: "Moderate carbs", detail: "\(fmt(carbs))g per 100g"))
                } else {
                    checks.append(.init(id: key, status: .ok, title: "Keto friendly", detail: "\(fmt(carbs))g carbs per 100g"))
                }
            } else {
                checks.append(.init(id: key, status: .unknown, title: "Keto: no carb data"))
            }

        case .lowSugar:
            switch food.levels[.sugars] {
            case nil: checks.append(.init(id: key, status: .unknown, title: "Sugar: no data"))
            case .high: checks.append(.init(id: key, status: .conflict, title: "High in sugar", detail: "\(fmt(food.nutrition.sugars))g per 100g"))
            case .moderate: checks.append(.init(id: key, status: .caution, title: "Moderate sugar", detail: "\(fmt(food.nutrition.sugars))g per 100g"))
            case .low: checks.append(.init(id: key, status: .ok, title: "Low in sugar"))
            }

        case .lowSalt:
            switch food.levels[.salt] {
            case nil: checks.append(.init(id: key, status: .unknown, title: "Salt: no data"))
            case .high: checks.append(.init(id: key, status: .conflict, title: "High in salt", detail: "\(fmt(food.nutrition.salt, digits: 2))g per 100g"))
            case .moderate: checks.append(.init(id: key, status: .caution, title: "Moderate salt", detail: "\(fmt(food.nutrition.salt, digits: 2))g per 100g"))
            case .low: checks.append(.init(id: key, status: .ok, title: "Low in salt"))
            }
        }
    }

    // A stable sort keeps the profile's own order within each status.
    return checks.enumerated()
        .sorted { ($0.element.status, $0.offset) < ($1.element.status, $1.offset) }
        .map { $0.element }
}

func overallStatus(_ checks: [ProfileCheck]) -> CheckStatus? {
    checks.map(\.status).min()
}
