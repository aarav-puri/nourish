import Foundation
import Observation

/// The person's own Gemini API key, kept in the Keychain on this device.
/// Every AI feature runs on it; nothing is sent to Nourish's database.
@MainActor
@Observable
final class KeyVault {
    private static let account = "gemini_api_key"

    private(set) var key: String = Keychain.string(for: KeyVault.account) ?? ""

    var hasKey: Bool { !key.isEmpty }

    func save(_ key: String) {
        self.key = key.trimmed
        Keychain.setString(self.key.isEmpty ? nil : self.key, for: Self.account)
    }

    func remove() { save("") }

    /// Shows the first and last few characters so a person can tell which key is saved.
    var masked: String {
        guard key.count > 10 else { return String(repeating: "•", count: key.count) }
        return "\(key.prefix(4))••••••••\(key.suffix(4))"
    }
}

enum GeminiError: LocalizedError {
    case missingKey, badKey, rateLimited, failed, unreadable

    var errorDescription: String? {
        switch self {
        case .missingKey: "Add your Gemini key in Settings to use AI features."
        case .badKey: "Google rejected your Gemini key. Check it in Settings."
        case .rateLimited: "Your Gemini key hit its rate limit. Wait a minute and try again."
        case .failed: "The AI did not respond. Try again."
        case .unreadable: "The AI returned something we could not read. Try again."
        }
    }
}

struct ChatMessage: Hashable {
    enum Role: String { case system, user, assistant }
    var role: Role
    var content: String
}

/// Gemini through Google's OpenAI-compatible endpoint, called straight from
/// the phone with the person's key.
struct Gemini {
    static let endpoint = URL(string: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions")!
    /// Insights: the careful model.
    static let insightModel = "gemini-3.8-flash"
    /// Formatting, scoring and chat: the quick one.
    static let fastModel = "gemini-3.5-flash-lite"

    let key: String

    init(key: String) throws {
        guard !key.isEmpty else { throw GeminiError.missingKey }
        self.key = key
    }

    func complete(
        _ messages: [ChatMessage],
        model: String = Gemini.fastModel,
        temperature: Double = 0.6,
        maxTokens: Int = 2000,
        timeout: TimeInterval = 45
    ) async throws -> String {
        let body: JSONValue = [
            "model": .string(model),
            "messages": .array(messages.map { ["role": .string($0.role.rawValue), "content": .string($0.content)] }),
            "temperature": .number(temperature),
            "max_tokens": .number(Double(maxTokens)),
        ]
        let request = HTTP.request(Self.endpoint, method: "POST", headers: ["Authorization": "Bearer \(key)"], json: body, timeout: timeout)
        let (data, response) = try await HTTP.send(request)
        switch response.statusCode {
        case 200..<300: break
        case 400, 401, 403: throw GeminiError.badKey
        case 429: throw GeminiError.rateLimited
        default: throw GeminiError.failed
        }
        guard let content = (try? JSONValue.decode(data))?["choices"]?[0]?["message"]?["content"]?.stringValue else {
            throw GeminiError.unreadable
        }
        return content
    }

    /// Asks for JSON and parses the answer.
    func json(
        prompt: String,
        system: String,
        model: String = Gemini.insightModel,
        temperature: Double = 0.6,
        maxTokens: Int = 8000,
        timeout: TimeInterval = 60
    ) async throws -> JSONValue {
        let text = try await complete(
            [
                ChatMessage(role: .system, content: "\(system) Respond with valid JSON only, no markdown."),
                ChatMessage(role: .user, content: prompt),
            ],
            model: model,
            temperature: temperature,
            maxTokens: maxTokens,
            timeout: timeout
        )
        guard let value = Self.parseJSON(text) else { throw GeminiError.unreadable }
        return value
    }

    /// Models sometimes wrap JSON in fences or prose; take the outermost object or array.
    static func parseJSON(_ text: String) -> JSONValue? {
        let clean = text.replacingOccurrences(of: "```json", with: "").replacingOccurrences(of: "```", with: "").trimmed
        if let value = try? JSONValue.decode(Data(clean.utf8)) { return value }
        guard let start = clean.firstIndex(where: { $0 == "{" || $0 == "[" }),
              let end = clean.lastIndex(where: { $0 == "}" || $0 == "]" }),
              start < end else { return nil }
        return try? JSONValue.decode(Data(clean[start...end].utf8))
    }

    enum Verification { case ok, invalid, unreachable }

    /// Checks a key by listing one model: free, and it spends none of the
    /// person's generation quota.
    static func verify(_ key: String) async -> Verification {
        let url = URL(string: "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1")!
        do {
            let (_, response) = try await HTTP.send(HTTP.request(url, headers: ["x-goog-api-key": key], timeout: 8))
            if (200..<300).contains(response.statusCode) { return .ok }
            return [400, 401, 403].contains(response.statusCode) ? .invalid : .unreachable
        } catch {
            return .unreachable
        }
    }
}
