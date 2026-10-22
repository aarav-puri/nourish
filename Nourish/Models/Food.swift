import Foundation

/*
 The product model the whole interface reads from.

 Product records arrive in three shapes: a fresh Open Food Facts lookup,
 older history rows that stored the full record, and products typed in by
 hand. `Food(raw:)` folds all three into one typed shape, so no view ever
 reads a raw record.

 Everything here is deterministic. Nutrient levels use the UK Food Standards
 Agency front-of-pack thresholds; nothing is estimated unless the record says
 it was.
 */

enum Grade: String, CaseIterable, Hashable {
    case a, b, c, d, e

    var label: String {
        switch self {
        case .a: "Excellent"
        case .b: "Good"
        case .c: "Average"
        case .d: "Poor"
        case .e: "Bad"
        }
    }

    var summary: String {
        switch self {
        case .a: "Among the best nutritional profiles in its kind."
        case .b: "A solid everyday choice."
        case .c: "Fine in moderation. Better options likely exist."
        case .d: "Best as an occasional food."
        case .e: "Weakest nutritional profile. Treat as a rare indulgence."
        }
    }

    init?(any value: String?) {
        guard let value, let grade = Grade(rawValue: value.lowercased()) else { return nil }
        self = grade
    }
}

enum Level: String, Hashable {
    case low, moderate, high

    var label: String {
        switch self {
        case .low: "Low"
        case .moderate: "Medium"
        case .high: "High"
        }
    }
}

enum Tri: Hashable {
    case yes, no, maybe
}

enum LevelNutrient: String, CaseIterable, Hashable {
    case fat, saturatedFat, sugars, salt
}

struct Nutrition: Hashable {
    var energyKcal: Double?
    var fat: Double?
    var saturatedFat: Double?
    var carbs: Double?
    var sugars: Double?
    var fiber: Double?
    var protein: Double?
    var salt: Double?

    var isEmpty: Bool {
        [energyKcal, fat, saturatedFat, carbs, sugars, fiber, protein, salt].allSatisfy { $0 == nil }
    }

    func value(_ nutrient: LevelNutrient) -> Double? {
        switch nutrient {
        case .fat: fat
        case .saturatedFat: saturatedFat
        case .sugars: sugars
        case .salt: salt
        }
    }
}

struct Additive: Hashable {
    let code: String
    let name: String?
}

struct NovaInfo {
    let label: String
    let detail: String

    static func of(_ group: Int) -> NovaInfo {
        switch group {
        case 1: NovaInfo(label: "Unprocessed", detail: "Whole or minimally processed food.")
        case 2: NovaInfo(label: "Culinary ingredient", detail: "Oils, butter, sugar, salt and similar.")
        case 3: NovaInfo(label: "Processed", detail: "Whole foods altered with salt, sugar or oil.")
        default: NovaInfo(label: "Ultra-processed", detail: "Industrial formulation, usually with additives.")
        }
    }
}

struct Food: Identifiable, Hashable {
    var id: String { barcode.isEmpty ? name : barcode }

    var barcode: String
    var name: String
    var brand: String?
    var quantity: String?
    var image: URL?
    var categories: String?
    var ingredientsText: String?
    var ingredients: [String]
    var highlights: [String]
    var grade: Grade?
    var gradeEstimated: Bool
    var eco: Grade?
    var ecoEstimated: Bool
    var nova: Int?
    var additives: [Additive]
    var allergens: [String]
    var traces: [String]
    var vegan: Tri?
    var vegetarian: Tri?
    var palmOil: Tri?
    var labels: [String]
    var packaging: String?
    var countries: String?
    var isBeverage: Bool
    var nutrition: Nutrition
    var levels: [LevelNutrient: Level]
    var manual: Bool
    /// The record as stored, so history can save and reload it unchanged.
    var raw: JSONValue

    var unit: String { isBeverage ? "100ml" : "100g" }

    /// The brand, unless it only repeats the name.
    var displayBrand: String? {
        guard let brand, brand.lowercased() != name.lowercased() else { return nil }
        return brand
    }
}

// MARK: - Normalisation

extension Food {
    private static let beverageTag = Pattern(#":(beverages|drinks|waters|sodas|juices)"#)
    private static let beverageWord = Pattern(#"\b(beverage|drink|soda|juice|water)s?\b"#)
    private static let langPrefix = Pattern(#"^[a-z]{2}:"#)
    private static let variantSuffix = Pattern(#"[a-z]+$"#)
    private static let estimatedMark = Pattern(#"\s*(℮|\be)\s*$"#)

    init(raw p: JSONValue, barcodeHint: String = "") {
        let n = p["nutriments"] ?? .null
        let ai = p["ai_formatted"] ?? .null
        let manual = p["manual"]?.boolValue ?? false

        let categoryTags = p["categories_tags"]?.stringArray ?? []
        let categories = p["categories"]?.stringValue ?? ""
        let isBeverage = categoryTags.contains { Food.beverageTag.test($0) } || Food.beverageWord.test(categories)

        // Energy: prefer the explicit kcal field; convert kJ when that is all there is.
        let energyUnit = (n["energy_unit"]?.stringValue ?? "").lowercased()
        let energyValue = n["energy_value"]?.doubleValue
        let kcal = first(
            n["energy-kcal_100g"]?.doubleValue,
            n["energy-kcal"]?.doubleValue,
            energyUnit == "kcal" || manual ? energyValue : nil,
            energyUnit == "kj" ? energyValue.map { $0 / 4.184 } : nil,
            n["energy_100g"]?.doubleValue.map { $0 / 4.184 }
        )

        let nutrition = Nutrition(
            energyKcal: kcal.map { $0.rounded() },
            fat: first(n["fat_100g"]?.doubleValue, n["fat"]?.doubleValue),
            saturatedFat: first(n["saturated-fat_100g"]?.doubleValue, n["saturated-fat"]?.doubleValue),
            carbs: first(n["carbohydrates_100g"]?.doubleValue, n["carbohydrates"]?.doubleValue),
            sugars: first(n["sugars_100g"]?.doubleValue, n["sugars"]?.doubleValue),
            fiber: first(n["fiber_100g"]?.doubleValue, n["fiber"]?.doubleValue),
            protein: first(n["proteins_100g"]?.doubleValue, n["proteins"]?.doubleValue),
            salt: first(n["salt_100g"]?.doubleValue, n["salt"]?.doubleValue, n["sodium_100g"]?.doubleValue.map { $0 * 2.5 })
        )

        var levels: [LevelNutrient: Level] = [:]
        for key in LevelNutrient.allCases {
            if let level = levelFor(key, nutrition.value(key), isBeverage: isBeverage) { levels[key] = level }
        }

        let analysis = p["ingredients_analysis_tags"]?.stringArray ?? []
        let estimated = p["ai_estimated_scores"]?.stringArray ?? []

        let codes = (p["additives_tags"]?.stringArray ?? []).map { Food.stripTag($0).lowercased() }
        // Drop duplicates, and sub-variants such as e322i when the parent e322 is listed.
        let additives = codes.uniqued()
            .filter { code in
                let base = Food.variantSuffix.replacing(in: code, with: "")
                return base == code || !codes.contains(base)
            }
            .map { code in
                Additive(
                    code: code.uppercased(),
                    name: additiveNames[code] ?? additiveNames[Food.variantSuffix.replacing(in: code, with: "")]
                )
            }

        func tagLabels(_ value: JSONValue?) -> [String] {
            (value?.stringArray ?? []).map(Food.stripTag).filter { !$0.isEmpty }.uniqued()
        }

        let ingredientsText = ai["formatted_ingredients"]?.stringValue ?? p["ingredients_text"]?.stringValue
        let nova = p["nova_group"]?.doubleValue.map { Int($0.rounded()) }

        // Declared allergens, plus any the ingredient text names: a record missing
        // its allergen tags must never read as allergen-free.
        let fromText = allergensInText(p["ingredients_text"]?.stringValue ?? ingredientsText)
        let allergens = (tagLabels(p["allergens_tags"]) + fromText.contains).uniqued()
        let traces = (tagLabels(p["traces_tags"]) + fromText.traces).uniqued().filter { !allergens.contains($0) }

        let imageString = p["image_front_url"]?.stringValue ?? p["image_url"]?.stringValue ?? p["image_front_small_url"]?.stringValue
        // Drop the ℮ "estimated quantity" mark, which often arrives as a bare "e".
        let quantity = p["quantity"]?.stringValue.map { Food.estimatedMark.replacing(in: $0, with: "").trimmed }

        self.init(
            barcode: p["code"]?.stringValue ?? p["barcode"]?.stringValue ?? barcodeHint,
            name: ai["formatted_name"]?.stringValue ?? p["product_name"]?.stringValue ?? p["product_name_en"]?.stringValue ?? "Unnamed product",
            brand: ai["formatted_brand"]?.stringValue
                ?? p["brands"]?.stringValue?.split(separator: ",").first.map { String($0).trimmed }.flatMap(\.nonEmpty),
            quantity: quantity?.nonEmpty,
            image: imageString.flatMap { URL(string: $0.replacingOccurrences(of: "http://", with: "https://")) },
            categories: categories.nonEmpty,
            ingredientsText: ingredientsText,
            ingredients: splitIngredients(ingredientsText),
            highlights: ai["key_highlights"]?.stringArray ?? [],
            grade: Grade(any: p["nutriscore_grade"]?.stringValue),
            gradeEstimated: estimated.contains("nutriscore_grade"),
            eco: Grade(any: p["ecoscore_grade"]?.stringValue),
            ecoEstimated: estimated.contains("ecoscore_grade"),
            nova: nova.flatMap { (1...4).contains($0) ? $0 : nil },
            additives: additives,
            allergens: allergens,
            traces: traces,
            vegan: tri(analysis, yes: "en:vegan", no: "en:non-vegan", maybe: "en:maybe-vegan"),
            vegetarian: tri(analysis, yes: "en:vegetarian", no: "en:non-vegetarian", maybe: "en:maybe-vegetarian"),
            palmOil: tri(analysis, yes: "en:palm-oil-free", no: "en:palm-oil", maybe: "en:may-contain-palm-oil"),
            labels: tagLabels(p["labels_tags"]),
            packaging: p["packaging"]?.stringValue,
            countries: p["countries"]?.stringValue,
            isBeverage: isBeverage,
            nutrition: nutrition,
            levels: levels,
            manual: manual,
            raw: p
        )
    }

    private static func stripTag(_ tag: String) -> String {
        langPrefix.replacing(in: tag, with: "")
    }
}

private func first(_ values: Double?...) -> Double? {
    values.lazy.compactMap { $0 }.first
}

private func tri(_ tags: [String], yes: String, no: String, maybe: String) -> Tri? {
    if tags.contains(no) { return .no }
    if tags.contains(maybe) { return .maybe }
    if tags.contains(yes) { return .yes }
    return nil
}

/// Splits an ingredient list on top-level commas, leaving bracketed sub-lists intact.
func splitIngredients(_ text: String?) -> [String] {
    guard let text else { return [] }
    let collapsed = Pattern(#"\s+"#).replacing(in: text, with: " ")
    var out: [String] = []
    var depth = 0
    var current = ""
    for ch in collapsed {
        if ch == "(" || ch == "[" { depth += 1 }
        if ch == ")" || ch == "]" { depth = max(0, depth - 1) }
        if (ch == "," || ch == ";") && depth == 0 {
            if !current.trimmed.isEmpty { out.append(current.trimmed) }
            current = ""
        } else {
            current.append(ch)
        }
    }
    var last = current.trimmed
    if last.hasSuffix(".") { last.removeLast() }
    if !last.isEmpty { out.append(last) }
    return out.map { $0.replacingOccurrences(of: "_", with: "") }.filter { !$0.isEmpty }
}

// MARK: - Nutrient levels (FSA front-of-pack, per 100g / 100ml)

func levelFor(_ key: LevelNutrient, _ value: Double?, isBeverage: Bool) -> Level? {
    guard let value else { return nil }
    let (low, high): (Double, Double) = switch (key, isBeverage) {
    case (.fat, false): (3, 17.5)
    case (.saturatedFat, false): (1.5, 5)
    case (.sugars, false): (5, 22.5)
    case (.salt, false): (0.3, 1.5)
    case (.fat, true): (1.5, 8.75)
    case (.saturatedFat, true): (0.75, 2.5)
    case (.sugars, true): (2.5, 11.25)
    case (.salt, true): (0.3, 0.75)
    }
    if value <= low { return .low }
    if value > high { return .high }
    return .moderate
}

// MARK: - Reading the label: strengths and concerns

struct KeyPoint: Hashable {
    enum Tone { case good, bad }
    let tone: Tone
    let text: String
}

extension Food {
    /// The handful of facts that explain a grade, worst first.
    var keyPoints: [KeyPoint] {
        var bad: [KeyPoint] = []
        var good: [KeyPoint] = []
        let n = nutrition

        if levels[.sugars] == .high { bad.append(.init(tone: .bad, text: "High in sugar, \(fmt(n.sugars))g per \(unit)")) }
        if levels[.saturatedFat] == .high { bad.append(.init(tone: .bad, text: "High in saturated fat, \(fmt(n.saturatedFat))g per \(unit)")) }
        if levels[.salt] == .high { bad.append(.init(tone: .bad, text: "High in salt, \(fmt(n.salt, digits: 2))g per \(unit)")) }
        if nova == 4 { bad.append(.init(tone: .bad, text: "Ultra-processed")) }
        if additives.count >= 5 { bad.append(.init(tone: .bad, text: "\(additives.count) additives")) }
        if levels[.fat] == .high && levels[.saturatedFat] != .high {
            bad.append(.init(tone: .bad, text: "High in fat, \(fmt(n.fat))g per \(unit)"))
        }

        if let fiber = n.fiber, fiber >= 6 { good.append(.init(tone: .good, text: "High in fibre, \(fmt(fiber))g")) }
        else if let fiber = n.fiber, fiber >= 3 { good.append(.init(tone: .good, text: "Source of fibre, \(fmt(fiber))g")) }
        if let protein = n.protein, protein >= 12 { good.append(.init(tone: .good, text: "High in protein, \(fmt(protein))g")) }
        if levels[.sugars] == .low { good.append(.init(tone: .good, text: "Low in sugar")) }
        if levels[.salt] == .low { good.append(.init(tone: .good, text: "Low in salt")) }
        if levels[.saturatedFat] == .low { good.append(.init(tone: .good, text: "Low in saturated fat")) }
        if nova == 1 { good.append(.init(tone: .good, text: "Unprocessed")) }
        if additives.isEmpty && !ingredients.isEmpty && !manual { good.append(.init(tone: .good, text: "No additives")) }

        return Array(bad.prefix(4)) + Array(good.prefix(4))
    }

    /// A short plain-text summary for sharing.
    var shareText: String {
        var lines = [displayBrand.map { "\(name) by \($0)" } ?? name]
        if let grade { lines.append("Nutri-Score \(grade.rawValue.uppercased()): \(grade.label)") }
        lines += keyPoints.map { ($0.tone == .bad ? "• " : "✓ ") + $0.text }
        lines.append("Scanned with Nourish")
        return lines.joined(separator: "\n")
    }
}

/// A number with at most `digits` decimals and no trailing zeros; "–" when missing.
func fmt(_ value: Double?, digits: Int = 1) -> String {
    guard let value else { return "–" }
    var text = String(format: "%.\(digits)f", value)
    if text.contains(".") {
        while text.hasSuffix("0") { text.removeLast() }
        if text.hasSuffix(".") { text.removeLast() }
    }
    return text
}

// MARK: - Allergens

struct Allergen: Identifiable, Hashable {
    let id: String
    let label: String

    static let all: [Allergen] = [
        .init(id: "gluten", label: "Gluten"),
        .init(id: "milk", label: "Milk"),
        .init(id: "eggs", label: "Eggs"),
        .init(id: "peanuts", label: "Peanuts"),
        .init(id: "nuts", label: "Tree nuts"),
        .init(id: "soybeans", label: "Soy"),
        .init(id: "fish", label: "Fish"),
        .init(id: "crustaceans", label: "Shellfish"),
        .init(id: "molluscs", label: "Molluscs"),
        .init(id: "sesame-seeds", label: "Sesame"),
        .init(id: "celery", label: "Celery"),
        .init(id: "mustard", label: "Mustard"),
        .init(id: "lupin", label: "Lupin"),
        .init(id: "sulphur-dioxide-and-sulphites", label: "Sulphites"),
    ]

    static func label(for id: String) -> String {
        if let known = all.first(where: { $0.id == id }) { return known.label }
        let words = id.replacingOccurrences(of: "-", with: " ")
        return words.prefix(1).uppercased() + words.dropFirst()
    }
}

// Words in an ingredient list that reveal an allergen, for records with no
// declared allergens (hand-entered products, sparse database entries).
// Lookbehinds skip the usual false friends: cocoa butter, coconut milk.
private let allergenWords: [(String, Pattern)] = [
    ("gluten", Pattern(#"\b(wheat|barley|rye|spelt|semolina|gluten|malt|couscous|bulgur|durum)\b"#)),
    ("milk", Pattern(#"\b((?<!(coconut|almond|oat|soy|soya|rice|cashew) )milk|buttermilk|cream|(?<!(cocoa|shea|peanut|nut|almond) )butter|cheese|whey|casein(ate)?|lactose|yogh?urt|ghee)\b"#)),
    ("eggs", Pattern(#"\b(eggs?|albumen|albumin)\b"#)),
    ("peanuts", Pattern(#"\b(peanuts?|groundnuts?)\b"#)),
    ("nuts", Pattern(#"\b(almonds?|hazelnuts?|walnuts?|cashews?|pecans?|pistachios?|macadamias?|brazil nuts?)\b"#)),
    ("soybeans", Pattern(#"\b(soy|soya|soybeans?|tofu)\b"#)),
    ("fish", Pattern(#"\b(fish|anchov(y|ies)|tuna|salmon|cod|sardines?|mackerel)\b"#)),
    ("crustaceans", Pattern(#"\b(shrimps?|prawns?|crabs?|lobsters?|crayfish)\b"#)),
    ("molluscs", Pattern(#"\b(mussels?|oysters?|squid|clams?|scallops?|octopus)\b"#)),
    ("sesame-seeds", Pattern(#"\b(sesame|tahini)\b"#)),
    ("celery", Pattern(#"\b(celery|celeriac)\b"#)),
    ("mustard", Pattern(#"\bmustard\b"#)),
    ("lupin", Pattern(#"\blupin\b"#)),
    ("sulphur-dioxide-and-sulphites", Pattern(#"\b(sulph|sulf)(ites?|ur dioxide)|metabisulphite"#)),
]

private let traceMarker = Pattern(#"may contain|traces? of|produced in a factory|made in a factory"#)

/// Allergens named in ingredient text: what it contains, and what it "may contain".
func allergensInText(_ text: String?) -> (contains: [String], traces: [String]) {
    guard let text else { return ([], []) }
    let split = traceMarker.firstIndex(in: text)
    let main = split.map { String(text[..<$0]) } ?? text
    let trace = split.map { String(text[$0...]) } ?? ""
    return (
        allergenWords.filter { $0.1.test(main) }.map { $0.0 },
        allergenWords.filter { $0.1.test(trace) }.map { $0.0 }
    )
}

// Ingredients a quick text search can tie to a diet, used when the database has no analysis.
let meatFishPattern = Pattern(#"\b(beef|pork|chicken|turkey|lamb|mutton|veal|bacon|ham|lard|tallow|gelatine?|anchov(y|ies)|fish|tuna|salmon|shrimp|prawn|crab|lobster|carmine|cochineal|rennet|chorizo|salami|pepperoni|meat)\b"#)
let animalProductPattern = Pattern(#"\b((?<!(coconut|almond|oat|soy|soya|rice|cashew) )milk|buttermilk|whey|casein|caseinate|lactose|(?<!(cocoa|shea|peanut|nut|almond) )butter|cream|cheese|yogh?urt|eggs?|honey|beeswax|ghee|albumin)\b"#)
let notHalalPattern = Pattern(#"\b(pork|bacon|ham|lard|gelatine?|wine|rum|beer|alcohol|ethanol|chorizo|salami|pepperoni)\b"#)

// MARK: - Additives

// The additives people most often meet on a label. Anything not listed is
// still shown, by its E number.
private let additiveNames: [String: String] = [
    "e100": "Curcumin", "e101": "Riboflavin", "e102": "Tartrazine", "e104": "Quinoline yellow",
    "e110": "Sunset yellow", "e120": "Carmine", "e122": "Azorubine", "e124": "Ponceau 4R",
    "e129": "Allura red", "e133": "Brilliant blue", "e150a": "Plain caramel", "e150c": "Ammonia caramel",
    "e150d": "Sulphite ammonia caramel", "e160a": "Carotenes", "e160b": "Annatto", "e160c": "Paprika extract",
    "e162": "Beetroot red", "e170": "Calcium carbonate", "e171": "Titanium dioxide",
    "e200": "Sorbic acid", "e202": "Potassium sorbate", "e211": "Sodium benzoate", "e220": "Sulphur dioxide",
    "e223": "Sodium metabisulphite", "e250": "Sodium nitrite", "e252": "Potassium nitrate",
    "e260": "Acetic acid", "e270": "Lactic acid", "e282": "Calcium propionate", "e290": "Carbon dioxide",
    "e296": "Malic acid", "e300": "Ascorbic acid", "e301": "Sodium ascorbate", "e306": "Tocopherols",
    "e307": "Alpha-tocopherol", "e319": "TBHQ", "e320": "BHA", "e321": "BHT", "e322": "Lecithins",
    "e322i": "Lecithin", "e325": "Sodium lactate", "e330": "Citric acid", "e331": "Sodium citrates",
    "e332": "Potassium citrates", "e334": "Tartaric acid", "e338": "Phosphoric acid",
    "e339": "Sodium phosphates", "e340": "Potassium phosphates", "e341": "Calcium phosphates",
    "e385": "Calcium disodium EDTA", "e400": "Alginic acid", "e401": "Sodium alginate", "e407": "Carrageenan",
    "e410": "Locust bean gum", "e412": "Guar gum", "e414": "Gum arabic", "e415": "Xanthan gum",
    "e420": "Sorbitol", "e422": "Glycerol", "e440": "Pectins", "e450": "Diphosphates",
    "e451": "Triphosphates", "e452": "Polyphosphates", "e460": "Cellulose", "e466": "Carboxymethyl cellulose",
    "e471": "Mono- and diglycerides", "e472e": "DATEM", "e476": "PGPR", "e481": "Sodium stearoyl lactylate",
    "e500": "Sodium carbonates", "e501": "Potassium carbonates", "e503": "Ammonium carbonates",
    "e508": "Potassium chloride", "e621": "Monosodium glutamate", "e627": "Disodium guanylate",
    "e631": "Disodium inosinate", "e635": "Disodium ribonucleotides", "e900": "Dimethylpolysiloxane",
    "e903": "Carnauba wax", "e904": "Shellac", "e941": "Nitrogen", "e950": "Acesulfame K",
    "e951": "Aspartame", "e955": "Sucralose", "e960": "Steviol glycosides", "e965": "Maltitol",
    "e967": "Xylitol", "e1400": "Dextrin", "e1422": "Acetylated distarch adipate", "e1442": "Hydroxypropyl distarch phosphate",
]
