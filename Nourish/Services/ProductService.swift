import Foundation

/// Looks products up in Open Food Facts, then, when the person has a Gemini
/// key, tidies the name and ingredient list and estimates any missing grades.
enum ProductService {
    enum Lookup {
        case found(Food)
        case notFound
    }

    // Only the fields the interface reads. A full record runs to hundreds of
    // kilobytes; this keeps the lookup fast and the stored history row small.
    private static let fields = [
        "code", "product_name", "product_name_en", "brands", "quantity", "categories", "categories_tags",
        "ingredients_text", "ingredients_text_en", "image_front_url", "image_url", "nutriments",
        "nutriscore_grade", "ecoscore_grade", "nova_group", "additives_tags", "allergens_tags",
        "traces_tags", "ingredients_analysis_tags", "labels_tags", "packaging", "countries", "serving_size",
    ]

    private static let nutrimentKeys = [
        "energy-kcal_100g", "energy_100g", "energy_value", "energy_unit", "fat_100g", "saturated-fat_100g",
        "carbohydrates_100g", "sugars_100g", "fiber_100g", "proteins_100g", "salt_100g", "sodium_100g",
    ]

    private static let retryable: Set<Int> = [408, 425, 429, 500, 502, 503, 504]
    private static let userAgent = "Nourish-iOS/3.0 (https://github.com/aarav-puri/nourish)"

    /// Digits only, or nil when it cannot be a retail barcode.
    static func normalize(_ code: String) -> String? {
        let digits = code.filter(\.isNumber)
        return (6...14).contains(digits.count) ? digits : nil
    }

    static func lookup(_ barcode: String, geminiKey: String?) async throws -> Lookup {
        guard var product = try await openFoodFacts(barcode) else { return .notFound }
        product["code"] = product["code"] ?? .string(barcode)

        if let key = geminiKey, let gemini = try? Gemini(key: key) {
            let record = JSONValue.object(product)
            async let formatted = format(record, with: gemini)
            async let scores = estimateGrades(record, with: gemini)
            let (tidy, grades) = await (formatted, scores)
            if let tidy { product["ai_formatted"] = tidy }
            apply(grades, to: &product)
        }
        return .found(Food(raw: .object(product), barcodeHint: barcode))
    }

    // MARK: Open Food Facts

    private static func openFoodFacts(_ barcode: String) async throws -> [String: JSONValue]? {
        var components = URLComponents(string: "https://world.openfoodfacts.org/api/v2/product/\(barcode)")!
        components.queryItems = [URLQueryItem(name: "fields", value: fields.joined(separator: ","))]
        let request = HTTP.request(components.url!, headers: ["User-Agent": userAgent], timeout: 12)

        var lastError: Error = AppError("The product database did not respond. Try again in a moment.")
        for attempt in 1...3 {
            do {
                let (data, response) = try await HTTP.send(request)
                if response.statusCode == 404 { return nil }
                if (200..<300).contains(response.statusCode) {
                    let body = try JSONValue.decode(data)
                    guard body["status"]?.doubleValue == 1, let product = body["product"]?.objectValue, !product.isEmpty else { return nil }
                    return slim(product)
                }
                guard retryable.contains(response.statusCode) else {
                    throw AppError("We could not look that product up.", status: response.statusCode)
                }
                lastError = AppError("The product database is slow to respond. Try again in a moment.", status: response.statusCode)
            } catch let error as URLError where error.code == .timedOut {
                lastError = AppError("The product database is slow to respond. Try again in a moment.")
            }
            try Task.checkCancellation()
            if attempt < 3 { try await Task.sleep(for: .milliseconds(300 * attempt)) }
        }
        throw lastError
    }

    private static func slim(_ product: [String: JSONValue]) -> [String: JSONValue] {
        var slim: [String: JSONValue] = [:]
        for key in fields where key != "nutriments" {
            guard let value = product[key], !value.isNull, value != .string("") else { continue }
            slim[key] = value
        }
        // Prefer the English text where the record has it; the default field is
        // in whatever language the product was first entered in.
        if let english = slim["ingredients_text_en"], english.stringValue != nil { slim["ingredients_text"] = english }
        if let english = slim["product_name_en"], english.stringValue != nil { slim["product_name"] = english }
        slim["ingredients_text_en"] = nil
        slim["product_name_en"] = nil

        var nutriments: [String: JSONValue] = [:]
        for key in nutrimentKeys {
            if let value = product["nutriments"]?[key] { nutriments[key] = value }
        }
        slim["nutriments"] = .object(nutriments)
        return slim
    }

    // MARK: Gemini touch-ups

    private static func format(_ product: JSONValue, with gemini: Gemini) async -> JSONValue? {
        let prompt = """
        Format this product information in a clean, well-structured way. Return ONLY valid JSON with these exact fields:

        Product Data:
        - Name: \(product["product_name"]?.stringValue ?? "Unknown")
        - Brand: \(product["brands"]?.stringValue ?? "Unknown")
        - Ingredients: \(product["ingredients_text"]?.stringValue ?? "Not available")

        IMPORTANT FORMATTING RULES:
        1. For ingredients: Capitalize the first letter of EACH ingredient properly (e.g., "Water, Sugar, Salt" not "water, sugar, salt")
        2. Keep ingredient list as comma-separated values
        3. Fix any obvious typos or formatting issues in ingredients
        4. Make product name and brand clean and properly capitalized

        Return JSON with these exact keys:
        {
          "formatted_name": "Clean product name with proper capitalization",
          "formatted_brand": "Clean brand name with proper capitalization",
          "formatted_ingredients": "Comma-separated ingredient list with EACH ingredient properly capitalized (first letter uppercase)",
          "key_highlights": ["2-3 key points about this product"]
        }
        """
        let value = try? await gemini.json(
            prompt: prompt,
            system: "You are a product information formatter.",
            model: Gemini.fastModel,
            temperature: 0.3,
            maxTokens: 1200,
            timeout: 8
        )
        return value?.objectValue == nil ? nil : value
    }

    static func needsGrades(_ product: JSONValue) -> Bool {
        Grade(any: product["nutriscore_grade"]?.stringValue) == nil || Grade(any: product["ecoscore_grade"]?.stringValue) == nil
    }

    /// Estimates the grades a record is missing. Published grades are never overwritten.
    static func estimateGrades(_ product: JSONValue, with gemini: Gemini) async -> JSONValue? {
        guard needsGrades(product) else { return nil }
        let n = product["nutriments"] ?? .null
        func v(_ keys: String...) -> String {
            keys.lazy.compactMap { n[$0]?.doubleValue }.first.map { fmt($0, digits: 2) } ?? "?"
        }
        let prompt = """
        Estimate the Nutri-Score and Eco-Score grades for this product from the data given.

        Product Data:
        - Name: \(product["product_name"]?.stringValue ?? "Unknown")
        - Brand: \(product["brands"]?.stringValue ?? "Unknown")
        - Categories: \(product["categories"]?.stringValue ?? "Unknown")
        - Ingredients: \(product["ingredients_text"]?.stringValue ?? "Not available")
        - Packaging: \(product["packaging"]?.stringValue ?? "Unknown")
        - Per 100g: energy \(v("energy-kcal_100g", "energy_value")) kcal, fat \(v("fat_100g", "fat"))g, saturated fat \(v("saturated-fat_100g", "saturated-fat"))g, sugars \(v("sugars_100g", "sugars"))g, salt \(v("salt_100g", "salt"))g, fiber \(v("fiber_100g", "fiber"))g, protein \(v("proteins_100g", "proteins"))g

        Use the official Nutri-Score and Eco-Score methods as closely as the data allows. Grades are a (best) to e (worst).
        If the item is not food or drink, or there is too little information to judge, use null.

        Return JSON with these exact keys:
        {
          "nutriscore_grade": "a" | "b" | "c" | "d" | "e" | null,
          "ecoscore_grade": "a" | "b" | "c" | "d" | "e" | null
        }
        """
        return try? await gemini.json(
            prompt: prompt,
            system: "You are a food scoring assistant.",
            model: Gemini.fastModel,
            temperature: 0.2,
            maxTokens: 100,
            timeout: 8
        )
    }

    /// Fills missing grades from an estimate and records which were estimated,
    /// so the interface can label them.
    static func apply(_ estimate: JSONValue?, to product: inout [String: JSONValue]) {
        guard let estimate else { return }
        var estimated: [String] = []
        for key in ["nutriscore_grade", "ecoscore_grade"] {
            if Grade(any: product[key]?.stringValue) == nil, let grade = Grade(any: estimate[key]?.stringValue) {
                product[key] = .string(grade.rawValue)
                estimated.append(key)
            }
        }
        if !estimated.isEmpty { product["ai_estimated_scores"] = JSONValue(estimated) }
    }
}
