import SwiftUI

/// One AI answer, laid out for its kind. Models do not always return the
/// exact shape asked for, so every field is read leniently.
struct InsightSheet: View {
    let insight: SavedInsight
    let food: Food
    let running: Bool
    let askAgain: () -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    HStack(spacing: 12) {
                        OliveAvatar(size: 40, thinking: running)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(food.name)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(Theme.ink)
                                .lineLimit(1)
                            Text(subtitle)
                                .font(.caption)
                                .foregroundStyle(Theme.ink3)
                                .lineLimit(2)
                        }
                    }
                    .padding(.bottom, 4)

                    content
                }
                .padding(20)
            }
            .background(Theme.paper)
            .navigationTitle(insight.kind.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
                ToolbarItem(placement: .bottomBar) {
                    Button {
                        askAgain()
                    } label: {
                        if running { ProgressView() } else { Label("Ask again", systemImage: "arrow.clockwise") }
                    }
                    .disabled(running)
                }
            }
        }
        .presentationDetents([.large])
        .presentationCornerRadius(28)
    }

    private var subtitle: String {
        var parts = [insight.createdAt.formatted(date: .abbreviated, time: .omitted)]
        if insight.kind == .dietCompatibility, let diets = insight.diets, !diets.isEmpty { parts.append(diets.joined(separator: ", ")) }
        return parts.joined(separator: " · ")
    }

    @ViewBuilder
    private var content: some View {
        switch insight.kind {
        case .alternatives:
            ForEach(Array(items(insight.content).enumerated()), id: \.offset) { index, item in
                AlternativeCard(item: item, index: index)
            }
        case .recipeSuggestions:
            ForEach(Array(items(insight.content).enumerated()), id: \.offset) { _, item in
                RecipeCard(item: item)
            }
        case .dietCompatibility:
            ForEach(Array((insight.content.objectValue ?? [:]).sorted { $0.key < $1.key }), id: \.key) { diet, value in
                DietResultCard(diet: diet, value: value)
            }
        case .ecoImpact:
            EcoCard(value: insight.content)
        }
    }

    /// The list in an answer, whether it came bare or wrapped in an object.
    private func items(_ value: JSONValue) -> [JSONValue] {
        if let array = value.arrayValue { return array }
        if let object = value.objectValue {
            if let array = object.values.first(where: { $0.arrayValue != nil })?.arrayValue { return array }
            return [value]
        }
        return []
    }
}

private func text(_ value: JSONValue?, _ keys: String...) -> String? {
    for key in keys {
        if let string = value?[key]?.stringValue { return string }
    }
    return nil
}

private struct AlternativeCard: View {
    let item: JSONValue
    let index: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                Text("\(index + 1)")
                    .font(.display(15))
                    .foregroundStyle(Theme.onAccent)
                    .frame(width: 28, height: 28)
                    .background(Theme.accent, in: Circle())
                Text(text(item, "product_name", "name") ?? "Alternative")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(Theme.ink)
                Spacer()
                if let price = text(item, "price_range") {
                    Text(price).font(.data(12)).foregroundStyle(Theme.ink3)
                }
            }
            if let why = text(item, "why_healthier", "reason") {
                Text(why).font(.subheadline).foregroundStyle(Theme.ink2).fixedSize(horizontal: false, vertical: true)
            }
            FlowLayout(spacing: 6, lineSpacing: 6) {
                if let sugar = text(item, "sugar_diff") { Chip(text: sugar, symbol: "cube", tint: Theme.low) }
                if let additives = text(item, "additive_diff") { Chip(text: additives, symbol: "flask", tint: Theme.low) }
                if let flavor = item["flavor_similarity"]?.doubleValue { Chip(text: "Taste match \(fmt(flavor, digits: 0))/10", symbol: "fork.knife") }
            }
        }
        .card(padding: 16)
    }
}

private struct RecipeCard: View {
    let item: JSONValue

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(text(item, "recipe_name", "name") ?? "Recipe")
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(Theme.ink)
            if let description = text(item, "description") {
                Text(description).font(.subheadline).foregroundStyle(Theme.ink2).fixedSize(horizontal: false, vertical: true)
            }
            FlowLayout(spacing: 6, lineSpacing: 6) {
                if let difficulty = text(item, "difficulty") { Chip(text: difficulty, symbol: "chart.bar") }
                if let prep = item["prep_time"]?.doubleValue { Chip(text: "\(fmt(prep, digits: 0)) min", symbol: "clock") }
                else if let prep = text(item, "prep_time") { Chip(text: prep, symbol: "clock") }
                if let calories = item["calories"]?.doubleValue { Chip(text: "\(fmt(calories, digits: 0)) kcal", symbol: "flame") }
            }
            let ingredients = item["other_ingredients"]?.stringArray ?? []
            if !ingredients.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("You will also need").eyebrow()
                    ForEach(ingredients, id: \.self) { ingredient in
                        HStack(alignment: .firstTextBaseline, spacing: 8) {
                            Circle().fill(Theme.accent).frame(width: 5, height: 5)
                            Text(ingredient).font(.subheadline).foregroundStyle(Theme.ink)
                        }
                    }
                }
                .padding(.top, 2)
            }
            if let benefits = text(item, "health_benefits") {
                Label(benefits, systemImage: "heart")
                    .font(.footnote)
                    .foregroundStyle(Theme.accentInk)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .card(padding: 16)
    }
}

private struct DietResultCard: View {
    let diet: String
    let value: JSONValue

    private var verdict: String { (text(value, "compatible") ?? "Maybe").capitalized }

    private var tint: Color {
        switch verdict.lowercased() {
        case "yes", "true": Theme.low
        case "no", "false": Theme.high
        default: Theme.moderate
        }
    }

    private var symbol: String {
        switch verdict.lowercased() {
        case "yes", "true": "checkmark.circle.fill"
        case "no", "false": "xmark.circle.fill"
        default: "questionmark.circle.fill"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(diet).font(.system(size: 17, weight: .semibold)).foregroundStyle(Theme.ink)
                Spacer()
                Label(verdict, systemImage: symbol)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(tint)
            }
            if let reason = text(value, "reason") {
                Text(reason).font(.subheadline).foregroundStyle(Theme.ink2).fixedSize(horizontal: false, vertical: true)
            }
            if let concerns = text(value, "concerns") ?? value["concerns"]?.stringArray.joined(separator: ", ").nonEmpty {
                Text("Watch for: \(concerns)").font(.footnote).foregroundStyle(Theme.ink)
            }
            if let alternatives = text(value, "alternatives") {
                Text("Try: \(alternatives)").font(.footnote).foregroundStyle(Theme.accentInk)
            }
            if let confidence = value["confidence"]?.doubleValue {
                HStack(spacing: 8) {
                    ProgressView(value: min(max(confidence, 0), 10), total: 10).tint(tint)
                    Text("\(fmt(confidence, digits: 0))/10 sure").font(.data(11)).foregroundStyle(Theme.ink3)
                }
            }
        }
        .card(padding: 16)
    }
}

private struct EcoCard: View {
    let value: JSONValue

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            if let score = value["overall_score"]?.doubleValue {
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(fmt(score, digits: 0)).font(.display(48)).foregroundStyle(Theme.accentInk)
                    Text("/ 10").font(.data(16)).foregroundStyle(Theme.ink3)
                    Spacer()
                    Text("Overall").eyebrow()
                }
            }
            if let comparison = text(value, "category_comparison") {
                Text(comparison).font(.subheadline.weight(.medium)).foregroundStyle(Theme.ink)
            }
            VStack(spacing: 0) {
                impactRow("Carbon", "carbon_footprint", "smoke")
                Divider().overlay(Theme.line)
                impactRow("Water", "water_usage", "drop")
                Divider().overlay(Theme.line)
                impactRow("Transport", "transportation_impact", "truck.box")
                if let packaging = value["packaging_score"]?.doubleValue {
                    Divider().overlay(Theme.line)
                    HStack {
                        Label("Packaging", systemImage: "shippingbox").foregroundStyle(Theme.ink)
                        Spacer()
                        Text("\(fmt(packaging, digits: 0))/10").font(.data(14, weight: .semibold)).foregroundStyle(Theme.ink)
                    }
                    .font(.subheadline)
                    .padding(.vertical, 10)
                }
            }
            if let explanation = text(value, "explanation") {
                Text(explanation).font(.subheadline).foregroundStyle(Theme.ink2).fixedSize(horizontal: false, vertical: true)
            }
            let tips = value["tips"]?.stringArray ?? []
            if !tips.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Tips").eyebrow()
                    ForEach(tips, id: \.self) { tip in
                        Label(tip, systemImage: "leaf").font(.subheadline).foregroundStyle(Theme.ink)
                    }
                }
            }
        }
        .card(padding: 18)
    }

    private func impactRow(_ label: String, _ key: String, _ symbol: String) -> some View {
        let level = text(value, key) ?? "–"
        let tint: Color = switch level.lowercased() {
        case "low": Theme.low
        case "high": Theme.high
        case "medium": Theme.moderate
        default: Theme.ink3
        }
        return HStack {
            Label(label, systemImage: symbol).foregroundStyle(Theme.ink)
            Spacer()
            Text(level).font(.system(size: 14, weight: .semibold)).foregroundStyle(tint)
        }
        .font(.subheadline)
        .padding(.vertical, 10)
    }
}
