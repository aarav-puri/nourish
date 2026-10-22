import Foundation

/// Case-insensitive ICU patterns, written like the web app's regular
/// expressions so the rules read the same in both.
struct Pattern {
    let regex: NSRegularExpression

    init(_ pattern: String, caseInsensitive: Bool = true) {
        // The patterns are literals in this codebase; a bad one is a programmer error.
        regex = try! NSRegularExpression(pattern: pattern, options: caseInsensitive ? [.caseInsensitive] : [])
    }

    func test(_ text: String) -> Bool {
        regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)) != nil
    }

    /// The first matching text.
    func match(in text: String) -> String? {
        guard let result = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
              let range = Range(result.range, in: text) else { return nil }
        return String(text[range])
    }

    /// Where the first match starts.
    func firstIndex(in text: String) -> String.Index? {
        guard let result = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
              let range = Range(result.range, in: text) else { return nil }
        return range.lowerBound
    }

    func replacing(in text: String, with template: String) -> String {
        regex.stringByReplacingMatches(in: text, range: NSRange(text.startIndex..., in: text), withTemplate: template)
    }
}

extension Array where Element: Hashable {
    /// Drops repeats, keeping the first of each in order.
    func uniqued() -> [Element] {
        var seen = Set<Element>()
        return filter { seen.insert($0).inserted }
    }
}

extension String {
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }

    /// nil when blank.
    var nonEmpty: String? { trimmed.isEmpty ? nil : self }
}
