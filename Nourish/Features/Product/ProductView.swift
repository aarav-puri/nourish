import SwiftUI

/// Everything about one product, from the grade down to the ingredients.
struct ProductView: View {
    let food: Food

    @Environment(Account.self) private var account
    @Environment(Router.self) private var router
    @State private var editingProfile = false

    private var checks: [ProfileCheck] { checkProduct(food, against: account.profile) }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                ProductHeader(food: food)
                VerdictCard(food: food)
                ForYouCard(checks: checks, profileEmpty: account.profile.isEmpty) { editingProfile = true }
                InsightsCard(food: food)
                NutritionCard(food: food)
                ProcessingCard(food: food)
                IngredientsCard(food: food)
                if food.manual {
                    Text("You entered these details by hand.")
                        .font(.footnote)
                        .foregroundStyle(Theme.ink3)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 4)
                }
                Text("Data from Open Food Facts, a free and open database. Grades marked as estimated come from AI.")
                    .font(.caption)
                    .foregroundStyle(Theme.ink3)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 4)
            }
            .padding(.horizontal, 16)
            .padding(.top, 4)
            .padding(.bottom, router.tab == .scan ? 96 : 24)
        }
        .background(Theme.paper.ignoresSafeArea())
        .navigationTitle(food.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Theme.paper, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                ShareLink(item: food.shareText) {
                    Image(systemName: "square.and.arrow.up")
                }
            }
        }
        .overlay(alignment: .bottomTrailing) {
            if router.tab == .scan {
                Button {
                    router.scanPath = []
                } label: {
                    Label("Scan next", systemImage: "barcode.viewfinder")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Theme.onAccent)
                        .padding(.horizontal, 20)
                        .frame(height: 54)
                        .background(Theme.accent, in: Capsule())
                        .shadow(color: Theme.accent.opacity(0.35), radius: 14, y: 6)
                }
                .buttonStyle(.pressable)
                .padding(20)
            }
        }
        .sheet(isPresented: $editingProfile) {
            NavigationStack { ProfileEditorView() }
        }
    }
}

// MARK: - Header

struct ProductHeader: View {
    let food: Food

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            ProductThumb(url: food.image, size: 104)
                .shadow(color: Theme.shadow, radius: 14, y: 6)
            VStack(alignment: .leading, spacing: 6) {
                if let brand = food.displayBrand {
                    Text(brand)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(Theme.ink2)
                        .lineLimit(1)
                }
                Text(food.name)
                    .font(.display(25))
                    .foregroundStyle(Theme.ink)
                    .fixedSize(horizontal: false, vertical: true)
                FlowLayout(spacing: 10, lineSpacing: 4) {
                    if let quantity = food.quantity { Text(quantity) }
                    if !food.barcode.isEmpty { Text(food.barcode) }
                    if food.manual { Text("Entered by hand") }
                }
                .font(.data(12))
                .foregroundStyle(Theme.ink3)
                .padding(.top, 2)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 4)
        .padding(.top, 8)
        .accessibilityElement(children: .combine)
    }
}

// MARK: - Verdict

struct VerdictCard: View {
    let food: Food

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text("Nutri-Score").eyebrow()
                    Spacer()
                    if food.gradeEstimated { EstimatedTag() }
                }
                HStack(alignment: .bottom) {
                    GradeScale(grade: food.grade)
                    Spacer(minLength: 12)
                    Text(food.grade?.label ?? "Not graded")
                        .font(.display(food.grade == nil ? 22 : 28))
                        .foregroundStyle(food.grade == nil ? Theme.ink2 : Theme.ink)
                        .multilineTextAlignment(.trailing)
                }
                Text(food.grade?.summary ?? "There is no published grade for this product, and not enough data to estimate one. The details below still apply.")
                    .font(.subheadline)
                    .foregroundStyle(Theme.ink2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(20)

            if !food.keyPoints.isEmpty {
                Divider().overlay(Theme.line)
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(food.keyPoints, id: \.self) { point in
                        HStack(spacing: 10) {
                            Image(systemName: point.tone == .bad ? "exclamationmark.circle.fill" : "checkmark.circle.fill")
                                .foregroundStyle(point.tone == .bad ? Theme.high : Theme.low)
                            Text(point.text)
                                .font(.system(size: 15))
                                .foregroundStyle(Theme.ink)
                        }
                        .accessibilityElement(children: .combine)
                        .accessibilityLabel((point.tone == .bad ? "Concern: " : "Strength: ") + point.text)
                    }
                }
                .padding(20)
            }

            if !food.highlights.isEmpty {
                Divider().overlay(Theme.line)
                VStack(alignment: .leading, spacing: 8) {
                    Text("Worth knowing").eyebrow()
                    ForEach(food.highlights.prefix(3), id: \.self) { highlight in
                        Text(highlight)
                            .font(.subheadline)
                            .foregroundStyle(Theme.ink2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .padding(20)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(colors: [Theme.accentSoft.opacity(0.6), Theme.surface], startPoint: .top, endPoint: .bottom),
            in: RoundedRectangle(cornerRadius: 24, style: .continuous)
        )
        .shadow(color: Theme.shadow, radius: 16, y: 6)
    }
}

struct EstimatedTag: View {
    var body: some View {
        Label("Estimated by AI", systemImage: "sparkles")
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(Theme.accentInk)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Theme.accentSoft, in: Capsule())
    }
}

// MARK: - For you

extension CheckStatus {
    var bannerTitle: String {
        switch self {
        case .conflict: "Does not fit your profile"
        case .caution: "Check the pack before buying"
        case .unknown: "Mostly fits, some unknowns"
        case .ok: "Fits your profile"
        }
    }

    var bannerSymbol: String {
        switch self {
        case .conflict: "xmark.shield.fill"
        case .caution, .unknown: "questionmark.diamond.fill"
        case .ok: "checkmark.shield.fill"
        }
    }

    var bannerFill: Color {
        switch self {
        case .conflict: Color(hex: 0xB8340D)
        case .caution: Color(hex: 0xC98A0B)
        case .unknown: Theme.surface3
        case .ok: Color(hex: 0x16703C)
        }
    }

    var bannerText: Color {
        switch self {
        case .unknown: Theme.ink
        case .caution: Color(hex: 0x2B2200)
        default: .white
        }
    }

    var rowSymbol: String {
        switch self {
        case .conflict, .caution: "exclamationmark.triangle.fill"
        case .unknown: "circle.dashed"
        case .ok: "checkmark.circle.fill"
        }
    }

    var rowTint: Color {
        switch self {
        case .conflict: Theme.high
        case .caution: Theme.moderate
        case .unknown: Theme.ink3
        case .ok: Theme.low
        }
    }
}

struct ForYouCard: View {
    let checks: [ProfileCheck]
    let profileEmpty: Bool
    let editProfile: () -> Void

    var body: some View {
        if profileEmpty {
            Button(action: editProfile) {
                HStack(alignment: .top, spacing: 14) {
                    Image(systemName: "checkmark.shield")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(Theme.accentInk)
                        .frame(width: 44, height: 44)
                        .background(Theme.accentSoft, in: Circle())
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Get warnings made for you")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundStyle(Theme.ink)
                        Text("Tell Nourish your diet and what you avoid, and every scan checks itself against it.")
                            .font(.subheadline)
                            .foregroundStyle(Theme.ink2)
                            .multilineTextAlignment(.leading)
                        Text("Set up your food profile")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(Theme.accentInk)
                            .padding(.top, 4)
                    }
                    Spacer(minLength: 0)
                }
                .card()
            }
            .buttonStyle(.pressable)
        } else {
            let status = overallStatus(checks) ?? .ok
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 10) {
                    Image(systemName: status.bannerSymbol)
                    Text(status.bannerTitle)
                    Spacer()
                }
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(status.bannerText)
                .padding(.horizontal, 20)
                .padding(.vertical, 14)
                .background(status.bannerFill)

                VStack(alignment: .leading, spacing: 0) {
                    ForEach(checks) { check in
                        HStack(alignment: .top, spacing: 12) {
                            Image(systemName: check.status.rowSymbol)
                                .foregroundStyle(check.status.rowTint)
                                .frame(width: 20)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(check.title)
                                    .font(.system(size: 15, weight: .medium))
                                    .foregroundStyle(Theme.ink)
                                if let detail = check.detail {
                                    Text(detail).font(.subheadline).foregroundStyle(Theme.ink2)
                                }
                            }
                            Spacer(minLength: 0)
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                        if check.id != checks.last?.id { Divider().overlay(Theme.line).padding(.leading, 52) }
                    }
                }
                .padding(.vertical, 4)

                Divider().overlay(Theme.line)
                Button("Edit your profile", action: editProfile)
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Theme.ink3)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
            }
            .background(Theme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            .shadow(color: Theme.shadow, radius: 16, y: 6)
        }
    }
}

// MARK: - Nutrition

struct NutritionCard: View {
    let food: Food

    private struct Row: Identifiable {
        var id: String { label }
        let label: String
        let value: Double?
        var digits = 1
        var indent = false
        var level: Level? = nil
        /// Bars are scaled to roughly twice the FSA "high" threshold, so a high
        /// reading fills well past halfway and a low one barely registers.
        var max: Double? = nil
    }

    private var rows: [Row] {
        let n = food.nutrition
        return [
            Row(label: "Fat", value: n.fat, level: food.levels[.fat], max: 35),
            Row(label: "Saturates", value: n.saturatedFat, indent: true, level: food.levels[.saturatedFat], max: 10),
            Row(label: "Carbohydrate", value: n.carbs),
            Row(label: "Sugars", value: n.sugars, indent: true, level: food.levels[.sugars], max: 45),
            Row(label: "Fibre", value: n.fiber),
            Row(label: "Protein", value: n.protein),
            Row(label: "Salt", value: n.salt, digits: 2, level: food.levels[.salt], max: 3),
        ]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                Text("Nutrition")
                    .font(.system(size: 26, weight: .black))
                    .foregroundStyle(Theme.ink)
                Spacer()
                Text("per \(food.unit)").font(.data(12)).foregroundStyle(Theme.ink3)
            }
            Rectangle().fill(Theme.ink).frame(height: 7).padding(.top, 6)

            if food.nutrition.isEmpty {
                Text("No nutrition facts have been published for this product.")
                    .font(.subheadline)
                    .foregroundStyle(Theme.ink2)
                    .padding(.vertical, 20)
            } else {
                HStack(alignment: .firstTextBaseline) {
                    Text("Energy").font(.system(size: 17, weight: .bold))
                    Spacer()
                    Text(food.nutrition.energyKcal.map { "\(fmt($0, digits: 0)) kcal" } ?? "–")
                        .font(.data(18, weight: .semibold))
                }
                .foregroundStyle(Theme.ink)
                .padding(.vertical, 10)
                Rectangle().fill(Theme.ink).frame(height: 3)

                ForEach(rows) { row in
                    NutrientRow(label: row.label, value: row.value, digits: row.digits, indent: row.indent, level: row.level, max: row.max)
                    if row.id != rows.last?.id { Divider().overlay(Theme.line) }
                }
            }
        }
        .card()
    }
}

private struct NutrientRow: View {
    let label: String
    let value: Double?
    let digits: Int
    let indent: Bool
    let level: Level?
    let max: Double?

    @State private var shown = false

    var body: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 6) {
                Text(label)
                    .font(.system(size: 15, weight: indent ? .regular : .semibold))
                    .foregroundStyle(indent ? Theme.ink2 : Theme.ink)
                if let level, let value, let max {
                    GeometryReader { proxy in
                        Capsule().fill(Theme.ink.opacity(0.07))
                            .overlay(alignment: .leading) {
                                Capsule().fill(level.color)
                                    .frame(width: proxy.size.width * (shown ? Swift.max(0.04, Swift.min(1, value / max)) : 0))
                            }
                    }
                    .frame(width: 150, height: 5)
                }
            }
            .padding(.leading, indent ? 16 : 0)
            Spacer()
            Text(value.map { "\(fmt($0, digits: digits))g" } ?? "–")
                .font(.data(15))
                .foregroundStyle(Theme.ink)
            Text(level != nil && value != nil ? level!.label : "")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(level?.color ?? .clear)
                .frame(width: 52, alignment: .trailing)
        }
        .padding(.vertical, 10)
        .onAppear { withAnimation(.easeOut(duration: 0.8).delay(0.2)) { shown = true } }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(label), \(value.map { "\(fmt($0, digits: digits)) grams" } ?? "not listed")\(level.map { ", \($0.label)" } ?? "")")
    }
}

// MARK: - Processing, additives, allergens, eco

struct ProcessingCard: View {
    let food: Food

    var body: some View {
        let hasAnything = food.nova != nil || !food.additives.isEmpty || !food.allergens.isEmpty || !food.traces.isEmpty || food.eco != nil
        if hasAnything {
            VStack(alignment: .leading, spacing: 0) {
                if let nova = food.nova {
                    section {
                        HStack {
                            Text("Processing").eyebrow()
                            Spacer()
                            Text("NOVA \(nova) of 4").font(.data(12)).foregroundStyle(Theme.ink3)
                        }
                        Text(NovaInfo.of(nova).label).font(.system(size: 17, weight: .semibold)).foregroundStyle(Theme.ink)
                        Text(NovaInfo.of(nova).detail).font(.subheadline).foregroundStyle(Theme.ink2)
                        HStack(spacing: 4) {
                            ForEach(1...4, id: \.self) { step in
                                Capsule()
                                    .fill(step <= nova ? (nova == 4 ? Theme.high : nova == 3 ? Theme.moderate : Theme.low) : Theme.ink.opacity(0.08))
                                    .frame(height: 6)
                            }
                        }
                        .padding(.top, 4)
                    }
                }

                if !food.additives.isEmpty {
                    divider(after: food.nova != nil)
                    section {
                        HStack {
                            Text("Additives").eyebrow()
                            Spacer()
                            Text("\(food.additives.count)").font(.data(12)).foregroundStyle(Theme.ink3)
                        }
                        FlowLayout(spacing: 6, lineSpacing: 6) {
                            ForEach(food.additives, id: \.code) { additive in
                                Chip(text: additive.name ?? additive.code, detail: additive.name == nil ? nil : additive.code, tint: Theme.ink)
                            }
                        }
                    }
                }

                if !food.allergens.isEmpty || !food.traces.isEmpty {
                    divider(after: food.nova != nil || !food.additives.isEmpty)
                    section {
                        Text("Allergens").eyebrow()
                        if !food.allergens.isEmpty {
                            (Text("Contains ").fontWeight(.semibold) + Text(food.allergens.map(Allergen.label(for:)).joined(separator: ", ")))
                                .font(.subheadline)
                                .foregroundStyle(Theme.ink)
                        }
                        if !food.traces.isEmpty {
                            (Text("May contain ").fontWeight(.medium).foregroundColor(Theme.ink) + Text(food.traces.map(Allergen.label(for:)).joined(separator: ", ")))
                                .font(.subheadline)
                                .foregroundStyle(Theme.ink2)
                        }
                    }
                }

                if let eco = food.eco {
                    divider(after: food.nova != nil || !food.additives.isEmpty || !food.allergens.isEmpty || !food.traces.isEmpty)
                    section {
                        HStack(alignment: .center) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Eco-Score").eyebrow()
                                Text("Environmental impact\(food.ecoEstimated ? ", estimated by AI" : "")")
                                    .font(.subheadline)
                                    .foregroundStyle(Theme.ink2)
                            }
                            Spacer()
                            GradeScale(grade: eco, label: "Eco-Score", compact: true)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
            .shadow(color: Theme.shadow, radius: 16, y: 6)
        }
    }

    private func section<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) { content() }
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private func divider(after previous: Bool) -> some View {
        if previous { Divider().overlay(Theme.line) }
    }
}

// MARK: - Ingredients

struct IngredientsCard: View {
    let food: Food
    @State private var showAll = false
    private let limit = 14

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Ingredients").eyebrow()
                Spacer()
                if !food.ingredients.isEmpty {
                    Text("\(food.ingredients.count)").font(.data(12)).foregroundStyle(Theme.ink3)
                }
            }
            if food.ingredients.isEmpty {
                Text("No ingredient list has been published for this product.")
                    .font(.subheadline)
                    .foregroundStyle(Theme.ink2)
            } else {
                let shown = showAll ? food.ingredients : Array(food.ingredients.prefix(limit))
                // The first three, which make up most of the product, stand out.
                shown.enumerated().reduce(Text("")) { text, item in
                    let piece = Text(item.element)
                        .fontWeight(item.offset < 3 ? .semibold : .regular)
                        .foregroundColor(item.offset < 3 ? Theme.ink : Theme.ink2)
                    let separator = item.offset < shown.count - 1 ? Text(", ").foregroundColor(Theme.ink3) : Text("")
                    return text + piece + separator
                }
                .font(.system(size: 15))
                .lineSpacing(4)
                .fixedSize(horizontal: false, vertical: true)

                if food.ingredients.count > limit {
                    Button(showAll ? "Show fewer" : "Show all \(food.ingredients.count)") {
                        withAnimation(.easeInOut) { showAll.toggle() }
                    }
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.accentInk)
                }
            }
        }
        .card()
    }
}
