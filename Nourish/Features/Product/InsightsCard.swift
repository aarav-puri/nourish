import SwiftUI

/// "Go further": AI answers about one product. Answers already generated
/// for this barcode load from history, so reopening one is instant and costs
/// nothing; new ones run on the person's own key and are saved.
struct InsightsCard: View {
    let food: Food

    @Environment(Account.self) private var account
    @Environment(KeyVault.self) private var keys
    @Environment(History.self) private var history
    @Environment(Router.self) private var router

    @State private var saved: [InsightKind: SavedInsight] = [:]
    @State private var running: InsightKind?
    @State private var usingDiets: [String] = []
    @State private var open: SavedInsight?
    @State private var pickingDiets = false
    @State private var error: String?
    @State private var needsKey = false

    private let columns = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)]
    private var profileDiets: [String] { account.profile.diets.map(\.label) }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 10) {
                OliveAvatar(size: 30, thinking: running != nil)
                Text("Go further")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(Theme.ink)
                Spacer()
            }

            LazyVGrid(columns: columns, spacing: 10) {
                ForEach(InsightKind.allCases) { kind in
                    Button { start(kind) } label: { tile(kind) }
                        .buttonStyle(.pressable)
                        .disabled(running != nil)
                }
            }

            if let running {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 8) {
                        ProgressView().controlSize(.small)
                        Text(running.runningLabel)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(Theme.ink)
                    }
                    FlowLayout(spacing: 6, lineSpacing: 6) {
                        Text("Using").font(.caption).foregroundStyle(Theme.ink3)
                        ForEach(contextChips, id: \.self) { Chip(text: $0) }
                    }
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Theme.surface2, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .transition(.opacity.combined(with: .move(edge: .top)))
            }

            if let error {
                Label(error, systemImage: "exclamationmark.triangle.fill")
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(Theme.high)
            }
        }
        .card()
        .animation(.spring(response: 0.35, dampingFraction: 0.85), value: running)
        .task(id: food.barcode) {
            saved = await history.insights(for: food.barcode)
        }
        .sheet(item: $open) { insight in
            InsightSheet(insight: insight, food: food, running: running == insight.kind) {
                ask(insight.kind, diets: insight.diets ?? profileDiets, fresh: true)
            }
        }
        .sheet(isPresented: $pickingDiets) {
            DietPickerSheet(initial: saved[.dietCompatibility]?.diets ?? profileDiets) { diets in
                pickingDiets = false
                ask(.dietCompatibility, diets: diets)
            }
            .presentationDetents([.medium, .large])
        }
        .alert("Add your Gemini key", isPresented: $needsKey) {
            Button("Open Settings") { router.tab = .settings }
            Button("Not now", role: .cancel) {}
        } message: {
            Text("AI answers run on your own free Gemini key. Add it in Profile to use them.")
        }
    }

    private func tile(_ kind: InsightKind) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                if running == kind {
                    ProgressView().controlSize(.small)
                } else {
                    Image(systemName: kind.symbol)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Theme.accentInk)
                }
                Spacer()
                if saved[kind] != nil && running != kind {
                    Text("SAVED")
                        .font(.data(9, weight: .semibold))
                        .foregroundStyle(Theme.ink3)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(Theme.ink.opacity(0.06), in: Capsule())
                }
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(kind.title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Theme.ink)
                Text(kind.blurb)
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.ink3)
                    .lineLimit(2, reservesSpace: true)
                    .multilineTextAlignment(.leading)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.paper, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(Theme.line, lineWidth: 1))
        .opacity(running != nil && running != kind ? 0.55 : 1)
    }

    /// Exactly what goes to Gemini with the question, shown while it works.
    private var contextChips: [String] {
        var chips: [String] = []
        if let grade = food.grade { chips.append("Nutri-Score \(grade.rawValue.uppercased())") }
        if !food.ingredients.isEmpty { chips.append("\(food.ingredients.count) ingredients") }
        if !food.additives.isEmpty { chips.append("\(food.additives.count) additive\(food.additives.count > 1 ? "s" : "")") }
        chips.append("Nutrition per \(food.unit)")
        return chips + usingDiets
    }

    private func start(_ kind: InsightKind) {
        if kind == .dietCompatibility {
            pickingDiets = true
        } else {
            ask(kind, diets: profileDiets)
        }
    }

    private func ask(_ kind: InsightKind, diets: [String], fresh: Bool = false) {
        error = nil
        if let cached = saved[kind], !fresh,
           kind != .dietCompatibility || Set(cached.diets ?? []) == Set(diets) {
            open = cached
            return
        }
        guard keys.hasKey else {
            needsKey = true
            return
        }
        usingDiets = diets
        running = kind
        Task {
            defer { running = nil }
            do {
                let content = try await AIService.run(kind, food: food, diets: diets, key: keys.key)
                let insight = SavedInsight(id: UUID().uuidString, kind: kind, content: content, createdAt: .now, diets: diets)
                saved[kind] = insight
                open = insight
                history.save(insight, for: food)
            } catch {
                self.error = error.friendlyMessage
                if (error as? GeminiError) == .badKey { needsKey = true }
            }
        }
    }
}

struct DietPickerSheet: View {
    let initial: [String]
    let onCheck: ([String]) -> Void
    @State private var selected: [String] = []

    private let options = Diet.allCases.map(\.label) + ["Paleo", "Low FODMAP", "Jain", "Mediterranean"]
    private let columns = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Pick the diets to check. Yours are selected already.")
                        .foregroundStyle(Theme.ink2)
                    LazyVGrid(columns: columns, spacing: 10) {
                        ForEach(options, id: \.self) { label in
                            let on = selected.contains(label)
                            Button {
                                if on { selected.removeAll { $0 == label } } else { selected.append(label) }
                            } label: {
                                HStack {
                                    Text(label).font(.system(size: 15, weight: .medium))
                                    Spacer()
                                    Image(systemName: on ? "checkmark.circle.fill" : "circle")
                                }
                                .foregroundStyle(on ? Theme.onAccent : Theme.ink)
                                .padding(.horizontal, 14)
                                .frame(height: 48)
                                .background(on ? Theme.accent : Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                                .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(on ? .clear : Theme.line))
                            }
                            .buttonStyle(.pressable)
                        }
                    }
                }
                .padding(20)
            }
            .background(Theme.paper)
            .navigationTitle("Check against diets")
            .navigationBarTitleDisplayMode(.inline)
            .safeAreaInset(edge: .bottom) {
                Button(selected.isEmpty ? "Pick at least one" : "Check \(selected.count) diet\(selected.count > 1 ? "s" : "")") {
                    onCheck(selected)
                }
                .buttonStyle(.primary)
                .disabled(selected.isEmpty)
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(.bar)
            }
            .sensoryFeedback(.selection, trigger: selected)
        }
        .onAppear { selected = initial }
    }
}
