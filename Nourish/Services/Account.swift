import AuthenticationServices
import Foundation
import Observation
import UIKit

/// The signed-in person: their session, profile and account actions.
@MainActor
@Observable
final class Account {
    private(set) var session: AuthSession?
    private(set) var isRestoring = true
    /// Set when a password reset link opened the app; the UI asks for a new password.
    var needsNewPassword = false

    var user: AuthUser? { session?.user }
    var isSignedIn: Bool { session != nil }
    var profile: FoodProfile { FoodProfile(metadata: user?.userMetadata) }

    private var refreshTask: Task<AuthSession, Error>?
    private var webAuth: ASWebAuthenticationSession?
    private let presenter = WebAuthPresenter()
    private static let sessionKey = "supabase.session"

    // MARK: Session

    func restore() async {
        defer { isRestoring = false }
        guard SupabaseConfig.isConfigured,
              let data = Keychain.data(for: Self.sessionKey),
              let stored = try? JSONDecoder().decode(AuthSession.self, from: data) else { return }
        session = stored
        do {
            if stored.isExpiring { _ = try await refreshedSession() }
            // Pick up profile changes made on another device.
            if let token = session?.accessToken {
                let user = try await SupabaseAPI.user(token: token)
                session?.user = user
                persist()
            }
        } catch let error as AppError where error.status == 400 || error.status == 401 || error.status == 403 {
            // The refresh token was revoked or the account is gone.
            clear()
        } catch {
            // Offline: keep the stored session and try again on the next call.
        }
    }

    /// A current access token, refreshing first when it is about to expire.
    func accessToken() async throws -> String {
        guard let session else { throw AppError("Sign in to continue.", status: 401) }
        if !session.isExpiring { return session.accessToken }
        return try await refreshedSession().accessToken
    }

    private func refreshedSession() async throws -> AuthSession {
        if let refreshTask { return try await refreshTask.value }
        guard let refreshToken = session?.refreshToken else { throw AppError("Sign in to continue.", status: 401) }
        let task = Task { try await SupabaseAPI.token(grant: "refresh_token", body: ["refresh_token": .string(refreshToken)]) }
        refreshTask = task
        defer { refreshTask = nil }
        let fresh = try await task.value
        set(fresh)
        return fresh
    }

    private func set(_ session: AuthSession) {
        self.session = session
        persist()
    }

    private func persist() {
        Keychain.setData(session.flatMap { try? JSONEncoder().encode($0) }, for: Self.sessionKey)
    }

    private func clear() {
        session = nil
        Keychain.setData(nil, for: Self.sessionKey)
    }

    // MARK: Email and password

    func signIn(email: String, password: String) async throws {
        do {
            set(try await SupabaseAPI.token(grant: "password", body: ["email": .string(email.trimmed), "password": .string(password)]))
        } catch let error as AppError where error.status == 400 {
            throw AppError(error.message.localizedCaseInsensitiveContains("confirm")
                ? "Confirm your email first. The link is in your inbox."
                : "That email and password do not match.")
        }
    }

    /// Creates an account. Returns false when Supabase wants the email
    /// confirmed before the first sign-in.
    func signUp(email: String, password: String) async throws -> Bool {
        let url = SupabaseConfig.endpoint("auth/v1/signup", query: [URLQueryItem(name: "redirect_to", value: SupabaseConfig.authCallback)])
        let request = HTTP.request(url, method: "POST", headers: SupabaseAPI.headers(), json: ["email": .string(email.trimmed), "password": .string(password)])
        let data = try await SupabaseAPI.call(request, fallback: "Could not create the account.")
        if let token = try? JSONDecoder().decode(TokenResponse.self, from: data) {
            set(token.session)
            return true
        }
        return false
    }

    func sendPasswordReset(email: String) async throws {
        let url = SupabaseConfig.endpoint("auth/v1/recover", query: [URLQueryItem(name: "redirect_to", value: SupabaseConfig.resetCallback)])
        try await SupabaseAPI.call(
            HTTP.request(url, method: "POST", headers: SupabaseAPI.headers(), json: ["email": .string(email.trimmed)]),
            fallback: "Could not send the reset email."
        )
    }

    func updatePassword(_ password: String) async throws {
        try await updateUser(["password": .string(password)])
        needsNewPassword = false
    }

    // MARK: Google

    func signInWithGoogle() async throws {
        let url = SupabaseConfig.endpoint("auth/v1/authorize", query: [
            URLQueryItem(name: "provider", value: "google"),
            URLQueryItem(name: "redirect_to", value: SupabaseConfig.authCallback),
        ])
        let callback: URL = try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(url: url, callbackURLScheme: "nourish") { url, error in
                if let url {
                    continuation.resume(returning: url)
                } else if let error = error as? ASWebAuthenticationSessionError, error.code == .canceledLogin {
                    continuation.resume(throwing: CancellationError())
                } else {
                    continuation.resume(throwing: error ?? AppError("Google sign in did not finish."))
                }
            }
            session.presentationContextProvider = presenter
            session.prefersEphemeralWebBrowserSession = false
            webAuth = session
            session.start()
        }
        webAuth = nil
        try await handle(callback)
    }

    /// Finishes sign-in from a redirect: tokens in the fragment (Google), or a
    /// one-time token hash in the query (password reset and email links).
    func handle(_ url: URL) async throws {
        guard url.scheme == "nourish" else { return }
        let params = Self.parameters(of: url)
        if let message = params["error_description"] {
            throw AppError(message.replacingOccurrences(of: "+", with: " "))
        }

        if let access = params["access_token"], let refresh = params["refresh_token"] {
            let user = try await SupabaseAPI.user(token: access)
            let expiry = params["expires_at"].flatMap { Double($0) }.map { Date(timeIntervalSince1970: $0) }
                ?? Date().addingTimeInterval(params["expires_in"].flatMap { Double($0) } ?? 3600)
            set(AuthSession(accessToken: access, refreshToken: refresh, expiresAt: expiry, user: user))
            if params["type"] == "recovery" { needsNewPassword = true }
            return
        }

        if let hash = params["token_hash"], let type = params["type"] {
            let request = HTTP.request(
                SupabaseConfig.endpoint("auth/v1/verify"),
                method: "POST",
                headers: SupabaseAPI.headers(),
                json: ["token_hash": .string(hash), "type": .string(type)]
            )
            let data = try await SupabaseAPI.call(request, fallback: "That link has expired. Ask for a new one.")
            set(try SupabaseAPI.decode(TokenResponse.self, from: data).session)
            if type == "recovery" { needsNewPassword = true }
        }
    }

    private static func parameters(of url: URL) -> [String: String] {
        var items: [URLQueryItem] = []
        if let components = URLComponents(url: url, resolvingAgainstBaseURL: false) {
            items += components.queryItems ?? []
            if let fragment = components.fragment {
                var fragmentComponents = URLComponents()
                fragmentComponents.query = fragment
                items += fragmentComponents.queryItems ?? []
            }
        }
        return Dictionary(items.compactMap { item in item.value.map { (item.name, $0) } }, uniquingKeysWith: { _, last in last })
    }

    // MARK: Profile

    func saveProfile(_ profile: FoodProfile, displayName: String? = nil) async throws {
        var data: [String: JSONValue] = ["food_profile": profile.json]
        if let displayName { data["display_name"] = .string(displayName.trimmed) }
        try await updateUser(["data": .object(data)])
    }

    private func updateUser(_ body: JSONValue) async throws {
        let token = try await accessToken()
        let request = HTTP.request(SupabaseConfig.endpoint("auth/v1/user"), method: "PUT", headers: SupabaseAPI.headers(token: token), json: body)
        let data = try await SupabaseAPI.call(request, fallback: "Could not save your changes.")
        let user = try SupabaseAPI.decode(AuthUser.self, from: data)
        session?.user = user
        persist()
    }

    // MARK: Avatar

    private static let avatarExtensions = ["jpg", "jpeg", "png", "webp", "gif"]

    func uploadAvatar(_ image: UIImage) async throws {
        guard let user else { return }
        let resized = image.preparingThumbnail(of: CGSize(width: 512, height: 512 * image.size.height / max(image.size.width, 1))) ?? image
        guard let jpeg = resized.jpegData(compressionQuality: 0.85) else { throw AppError("Could not read that image.") }
        let token = try await accessToken()
        let path = "\(user.id)/avatar.jpg"
        var headers = SupabaseAPI.headers(token: token)
        headers["Content-Type"] = "image/jpeg"
        headers["x-upsert"] = "true"
        headers["Cache-Control"] = "max-age=0"
        try await SupabaseAPI.call(
            HTTP.request(SupabaseConfig.endpoint("storage/v1/object/avatars/\(path)"), method: "POST", headers: headers, body: jpeg),
            fallback: "Could not upload that photo."
        )
        // Bust caches on repeated uploads to the same path.
        let publicURL = SupabaseConfig.endpoint("storage/v1/object/public/avatars/\(path)").absoluteString + "?v=\(Int(Date().timeIntervalSince1970))"
        try await updateUser(["data": ["avatar_url": .string(publicURL)]])
    }

    func removeAvatar() async throws {
        try await removeAvatarFiles()
        try await updateUser(["data": ["avatar_url": .null]])
    }

    private func removeAvatarFiles() async throws {
        guard let user else { return }
        let token = try await accessToken()
        let prefixes = Self.avatarExtensions.map { JSONValue.string("\(user.id)/avatar.\($0)") }
        try await SupabaseAPI.call(
            HTTP.request(SupabaseConfig.endpoint("storage/v1/object/avatars"), method: "DELETE", headers: SupabaseAPI.headers(token: token), json: ["prefixes": .array(prefixes)]),
            fallback: "Could not remove the photo."
        )
    }

    // MARK: Leaving

    func signOut() async {
        if let token = session?.accessToken {
            let request = HTTP.request(SupabaseConfig.endpoint("auth/v1/logout"), method: "POST", headers: SupabaseAPI.headers(token: token))
            _ = try? await HTTP.send(request)
        }
        clear()
    }

    /// Deletes the avatar, then calls the `delete_my_account` database
    /// function (supabase/sql/delete-account.sql), which removes every row the
    /// person owns and the auth user itself.
    func deleteAccount() async throws {
        try? await removeAvatarFiles()
        let token = try await accessToken()
        let request = HTTP.request(SupabaseConfig.endpoint("rest/v1/rpc/delete_my_account"), method: "POST", headers: SupabaseAPI.headers(token: token), json: [:])
        try await SupabaseAPI.call(request, fallback: "Could not delete the account.")
        clear()
    }

    /// Marks onboarding done for this person on this device.
    var hasFinishedSetup: Bool {
        get {
            access(keyPath: \.session)
            guard let id = user?.id else { return false }
            return UserDefaults.standard.bool(forKey: "setup.done.\(id)")
        }
        set {
            guard let id = user?.id else { return }
            withMutation(keyPath: \.session) {
                UserDefaults.standard.set(newValue, forKey: "setup.done.\(id)")
            }
        }
    }
}

/// Anchors the Google sign-in sheet to the key window.
private final class WebAuthPresenter: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        return scenes.flatMap(\.windows).first(where: \.isKeyWindow) ?? ASPresentationAnchor()
    }
}
