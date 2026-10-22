import Foundation
import Observation

struct ScanEntry: Identifiable, Hashable {
    var id: String { food.barcode.isEmpty ? rowID : food.barcode }
    let rowID: String
    let food: Food
    let scannedAt: Date
    /// How many times this product has been scanned.
    var count: Int = 1
}

/// Scan history and saved AI answers, stored in Supabase per account. Also a
/// cache of every product loaded this session, so reopening one is instant.
@MainActor
@Observable
final class History {
    private(set) var entries: [ScanEntry] = []
    private(set) var isLoading = false
    private(set) var hasLoaded = false
    private(set) var loadError: String?

    /// Products by barcode.
    private(set) var cache: [String: Food] = [:]

    private let account: Account

    init(account: Account) {
        self.account = account
    }

    // MARK: Rows

    private struct ScanRow: Decodable {
        let id: JSONValue
        let barcode: String?
        let product_name: String?
        let product_data: JSONValue?
        let scanned_at: String?
    }

    private struct InsightRow: Decodable {
        let id: JSONValue
        let insight_type: String
        let insight_data: JSONValue?
        let created_at: String?
    }

    private func rest(_ table: String, query: [URLQueryItem] = []) -> URL {
        SupabaseConfig.endpoint("rest/v1/\(table)", query: query)
    }

    private func authHeaders(prefer: String? = nil) async throws -> [String: String] {
        var headers = SupabaseAPI.headers(token: try await account.accessToken())
        if let prefer { headers["Prefer"] = prefer }
        return headers
    }

    // MARK: Scans

    func refresh() async {
        guard let user = account.user else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let url = rest("scanned_products", query: [
                URLQueryItem(name: "select", value: "id,barcode,product_name,product_data,scanned_at"),
                URLQueryItem(name: "user_id", value: "eq.\(user.id)"),
                URLQueryItem(name: "order", value: "scanned_at.desc"),
                URLQueryItem(name: "limit", value: "200"),
            ])
            let data = try await SupabaseAPI.call(HTTP.request(url, headers: try await authHeaders()), fallback: "Could not load your history.")
            let rows = try SupabaseAPI.decode([ScanRow].self, from: data)

            // History lists each product once, at its latest scan.
            var byCode: [String: Int] = [:]
            var list: [ScanEntry] = []
            for row in rows {
                let code = row.barcode ?? ""
                if !code.isEmpty, let index = byCode[code] {
                    list[index].count += 1
                    continue
                }
                let food = Food(raw: row.product_data ?? ["product_name": JSONValue(row.product_name)], barcodeHint: code)
                if !code.isEmpty {
                    byCode[code] = list.count
                    if cache[code] == nil { cache[code] = food }
                }
                list.append(ScanEntry(rowID: row.id.stringValue ?? UUID().uuidString, food: food, scannedAt: parseTimestamp(row.scanned_at) ?? .now))
            }
            entries = list
            loadError = nil
            hasLoaded = true
        } catch {
            if !error.isCancellation { loadError = error.friendlyMessage }
        }
    }

    /// Records a scan. Best effort: the result is already on screen.
    func record(_ food: Food) {
        if !food.barcode.isEmpty { cache[food.barcode] = food }
        let entry = ScanEntry(rowID: UUID().uuidString, food: food, scannedAt: .now, count: (entries.first { $0.id == food.id }?.count ?? 0) + 1)
        entries.removeAll { $0.id == entry.id }
        entries.insert(entry, at: 0)

        guard let user = account.user else { return }
        Task {
            let body: JSONValue = [
                "user_id": .string(user.id),
                "barcode": .string(food.barcode),
                "product_name": .string(food.name),
                "product_data": food.raw,
            ]
            guard let headers = try? await authHeaders(prefer: "return=minimal") else { return }
            _ = try? await SupabaseAPI.call(HTTP.request(rest("scanned_products"), method: "POST", headers: headers, json: body), fallback: "")
        }
    }

    func remember(_ food: Food) {
        if !food.barcode.isEmpty { cache[food.barcode] = food }
    }

    func forget(_ barcode: String) {
        cache[barcode] = nil
    }

    func delete(_ entry: ScanEntry) async throws {
        let previous = entries
        entries.removeAll { $0.id == entry.id }
        guard let user = account.user else { return }
        do {
            let code = entry.food.barcode
            let filter = code.isEmpty
                ? URLQueryItem(name: "id", value: "eq.\(entry.rowID)")
                : URLQueryItem(name: "barcode", value: "eq.\(code)")
            let url = rest("scanned_products", query: [filter, URLQueryItem(name: "user_id", value: "eq.\(user.id)")])
            try await SupabaseAPI.call(HTTP.request(url, method: "DELETE", headers: try await authHeaders()), fallback: "Could not delete that scan.")
        } catch {
            entries = previous
            throw error
        }
    }

    func clearAll() async throws {
        guard let user = account.user else { return }
        for table in ["scanned_products", "ai_insights"] {
            let url = rest(table, query: [URLQueryItem(name: "user_id", value: "eq.\(user.id)")])
            try await SupabaseAPI.call(HTTP.request(url, method: "DELETE", headers: try await authHeaders()), fallback: "Could not clear your history.")
        }
        entries = []
    }

    func reset() {
        entries = []
        cache = [:]
        hasLoaded = false
    }

    // MARK: Insights

    /// The latest saved answer of each kind for one product.
    func insights(for barcode: String) async -> [InsightKind: SavedInsight] {
        guard let user = account.user, !barcode.isEmpty else { return [:] }
        let url = rest("ai_insights", query: [
            URLQueryItem(name: "select", value: "id,insight_type,insight_data,created_at"),
            URLQueryItem(name: "user_id", value: "eq.\(user.id)"),
            URLQueryItem(name: "barcode", value: "eq.\(barcode)"),
            URLQueryItem(name: "order", value: "created_at.desc"),
            URLQueryItem(name: "limit", value: "20"),
        ])
        guard let headers = try? await authHeaders(),
              let data = try? await SupabaseAPI.call(HTTP.request(url, headers: headers), fallback: ""),
              let rows = try? JSONDecoder().decode([InsightRow].self, from: data) else { return [:] }

        var latest: [InsightKind: SavedInsight] = [:]
        // Rows arrive newest first, so the first of each kind wins.
        for row in rows {
            guard let kind = InsightKind(rawValue: row.insight_type), latest[kind] == nil,
                  let content = row.insight_data?["content"], !content.isNull else { continue }
            latest[kind] = SavedInsight(
                id: row.id.stringValue ?? UUID().uuidString,
                kind: kind,
                content: content,
                createdAt: parseTimestamp(row.created_at) ?? .now,
                diets: row.insight_data?["diets"]?.arrayValue.map { $0.compactMap(\.stringValue) }
            )
        }
        return latest
    }

    func save(_ insight: SavedInsight, for food: Food) {
        guard let user = account.user else { return }
        Task {
            var data: [String: JSONValue] = ["title": .string(insight.kind.title), "content": insight.content]
            if let diets = insight.diets { data["diets"] = JSONValue(diets) }
            let body: JSONValue = [
                "user_id": .string(user.id),
                "barcode": .string(food.barcode),
                "product_name": .string(food.name),
                "insight_type": .string(insight.kind.rawValue),
                "insight_data": .object(data),
            ]
            guard let headers = try? await authHeaders(prefer: "return=minimal") else { return }
            _ = try? await SupabaseAPI.call(HTTP.request(rest("ai_insights"), method: "POST", headers: headers, json: body), fallback: "")
        }
    }
}

/// Postgres timestamps, with or without fractional seconds.
func parseTimestamp(_ text: String?) -> Date? {
    guard var text else { return nil }
    // Trim microseconds to milliseconds, which ISO8601DateFormatter reads reliably.
    text = Pattern(#"(\.\d{3})\d+"#).replacing(in: text, with: "$1")
    let withFraction = ISO8601DateFormatter()
    withFraction.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let date = withFraction.date(from: text) { return date }
    return ISO8601DateFormatter().date(from: text)
}
