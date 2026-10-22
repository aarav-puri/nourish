import Foundation

/// A failed request, with a message fit to show a person.
struct AppError: LocalizedError, Equatable {
    var message: String
    var status: Int?

    var errorDescription: String? { message }

    init(_ message: String, status: Int? = nil) {
        self.message = message
        self.status = status
    }

    static let offline = AppError("You are offline. Reconnect and try again.")
}

enum HTTP {
    static let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 20
        config.waitsForConnectivity = false
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        return URLSession(configuration: config)
    }()

    static func request(
        _ url: URL,
        method: String = "GET",
        headers: [String: String] = [:],
        json: JSONValue? = nil,
        body: Data? = nil,
        timeout: TimeInterval = 20
    ) -> URLRequest {
        var request = URLRequest(url: url, timeoutInterval: timeout)
        request.httpMethod = method
        for (key, value) in headers { request.setValue(value, forHTTPHeaderField: key) }
        if let json {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try? json.encoded()
        } else if let body {
            request.httpBody = body
        }
        return request
    }

    /// Sends a request; any status is returned rather than thrown. Network
    /// failures throw, with offline mapped to a friendly message.
    static func send(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else { throw AppError("Unexpected response.") }
            return (data, http)
        } catch let error as URLError where [.notConnectedToInternet, .networkConnectionLost, .dataNotAllowed].contains(error.code) {
            throw AppError.offline
        }
    }

    /// The human message in a JSON error body, from the shapes Supabase and
    /// Google use.
    static func message(in data: Data) -> String? {
        guard let json = try? JSONValue.decode(data) else { return nil }
        return json["error_description"]?.stringValue
            ?? json["msg"]?.stringValue
            ?? json["message"]?.stringValue
            ?? json["error"]?["message"]?.stringValue
            ?? json["error"]?.stringValue
    }
}

extension Error {
    var isCancellation: Bool {
        if self is CancellationError { return true }
        if let url = self as? URLError, url.code == .cancelled { return true }
        return false
    }

    /// The message to show a person for any error.
    var friendlyMessage: String {
        if let app = self as? AppError { return app.message }
        if let url = self as? URLError {
            return url.code == .timedOut ? "That took too long. Try again." : "Something went wrong with the connection. Try again."
        }
        return (self as? LocalizedError)?.errorDescription ?? "Something went wrong. Try again."
    }
}
