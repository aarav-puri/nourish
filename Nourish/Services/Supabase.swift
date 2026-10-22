import Foundation

/// The project's Supabase URL and public anon key, from Config/*.xcconfig
/// through Info.plist.
enum SupabaseConfig {
    static let url: URL? = {
        guard let raw = Bundle.main.object(forInfoDictionaryKey: "SupabaseURL") as? String,
              !raw.contains("your-project"), !raw.contains("$("),
              let url = URL(string: raw), url.host != nil, url.host != "" else { return nil }
        return url
    }()

    static let anonKey: String = {
        let raw = (Bundle.main.object(forInfoDictionaryKey: "SupabaseAnonKey") as? String) ?? ""
        return raw.contains("$(") ? "" : raw.trimmed
    }()

    static var isConfigured: Bool { url != nil && !anonKey.isEmpty }

    /// Where Supabase sends people back to after Google sign-in and password
    /// reset links. Add both to Authentication > URL Configuration > Redirect URLs.
    static let authCallback = "nourish://auth-callback"
    static let resetCallback = "nourish://reset-password"

    static func endpoint(_ path: String, query: [URLQueryItem] = []) -> URL {
        var components = URLComponents(url: url!.appending(path: path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty { components.queryItems = query }
        return components.url!
    }
}

// MARK: - Auth models

struct AuthUser: Codable, Hashable {
    let id: String
    var email: String?
    var userMetadata: JSONValue?
    var appMetadata: JSONValue?
    var createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, email
        case userMetadata = "user_metadata"
        case appMetadata = "app_metadata"
        case createdAt = "created_at"
    }

    var displayName: String? {
        userMetadata?["display_name"]?.stringValue
            ?? userMetadata?["full_name"]?.stringValue
            ?? userMetadata?["name"]?.stringValue
    }

    var avatarURL: URL? {
        (userMetadata?["avatar_url"]?.stringValue ?? userMetadata?["picture"]?.stringValue).flatMap(URL.init(string:))
    }

    var provider: String? { appMetadata?["provider"]?.stringValue }

    /// First name for greetings, falling back to the email's local part.
    var greetingName: String? {
        if let name = displayName?.split(separator: " ").first { return String(name) }
        return nil
    }

    var initials: String {
        let source = displayName ?? email ?? "?"
        let parts = source.split(whereSeparator: { $0 == " " || $0 == "." || $0 == "@" }).prefix(2)
        return parts.compactMap { $0.first }.map { String($0) }.joined().uppercased()
    }
}

struct AuthSession: Codable, Hashable {
    var accessToken: String
    var refreshToken: String
    var expiresAt: Date
    var user: AuthUser

    var isExpiring: Bool { expiresAt.timeIntervalSinceNow < 60 }
}

/// The token response GoTrue sends for sign-in, sign-up and refresh.
struct TokenResponse: Decodable {
    let access_token: String
    let refresh_token: String
    let expires_in: Double?
    let expires_at: Double?
    let user: AuthUser

    var session: AuthSession {
        let expiry = expires_at.map { Date(timeIntervalSince1970: $0) }
            ?? Date().addingTimeInterval(expires_in ?? 3600)
        return AuthSession(accessToken: access_token, refreshToken: refresh_token, expiresAt: expiry, user: user)
    }
}

// MARK: - Low-level calls

/// Thin wrappers over Supabase's REST endpoints (GoTrue, PostgREST and
/// Storage). Every call carries the anon key; signed-in calls add the
/// person's access token, which row-level security authorises against.
enum SupabaseAPI {
    static func headers(token: String? = nil) -> [String: String] {
        [
            "apikey": SupabaseConfig.anonKey,
            "Authorization": "Bearer \(token ?? SupabaseConfig.anonKey)",
            "X-Client-Info": "nourish-ios/3.0",
        ]
    }

    /// Sends and checks the status, turning an error body into its message.
    @discardableResult
    static func call(_ request: URLRequest, fallback: String) async throws -> Data {
        let (data, response) = try await HTTP.send(request)
        guard (200..<300).contains(response.statusCode) else {
            throw AppError(HTTP.message(in: data) ?? fallback, status: response.statusCode)
        }
        return data
    }

    static func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        do {
            return try JSONDecoder().decode(type, from: data)
        } catch {
            throw AppError("The server sent something unexpected. Try again.")
        }
    }

    static func token(grant: String, body: JSONValue) async throws -> AuthSession {
        let url = SupabaseConfig.endpoint("auth/v1/token", query: [URLQueryItem(name: "grant_type", value: grant)])
        let data = try await call(HTTP.request(url, method: "POST", headers: headers(), json: body), fallback: "Could not sign in.")
        return try decode(TokenResponse.self, from: data).session
    }

    static func user(token: String) async throws -> AuthUser {
        let data = try await call(HTTP.request(SupabaseConfig.endpoint("auth/v1/user"), headers: headers(token: token)), fallback: "Could not load your account.")
        return try decode(AuthUser.self, from: data)
    }
}
