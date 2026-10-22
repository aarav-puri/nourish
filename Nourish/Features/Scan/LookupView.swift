import SwiftUI

/// Looks a barcode up, then shows the report in place.
struct LookupView: View {
    let code: String

    @Environment(History.self) private var history
    @Environment(KeyVault.self) private var keys
    @Environment(Router.self) private var router
    @State private var phase: Phase = .loading
    @State private var attempt = 0
    @State private var slow = false

    enum Phase: Equatable {
        case loading
        case found(Food)
        case notFound
        case failed(String, offline: Bool)
    }

    var body: some View {
        Group {
            switch phase {
            case .loading:
                LoadingReport(code: code, slow: slow)
            case .found(let food):
                ProductView(food: food)
                    .transition(.opacity.combined(with: .scale(scale: 0.98)))
            case .notFound:
                StateCard(
                    symbol: "magnifyingglass",
                    title: "Not in the database yet",
                    message: "No product uses \(code) in Open Food Facts. Newer and local products are often missing. Check the digits, or enter the details from the pack and Nourish will analyse them."
                ) {
                    Button {
                        router.scanPath = [.manual(code)]
                    } label: {
                        Label("Enter details from the pack", systemImage: "square.and.pencil")
                    }
                    .buttonStyle(.primary)
                    Button("Scan something else") { router.scanPath = [] }
                        .buttonStyle(.secondary)
                }
            case .failed(let message, let offline):
                StateCard(
                    symbol: offline ? "wifi.slash" : "arrow.clockwise",
                    title: offline ? "No connection" : "The lookup did not finish",
                    message: message
                ) {
                    Button {
                        attempt += 1
                    } label: {
                        Label("Try again", systemImage: "arrow.clockwise")
                    }
                    .buttonStyle(.primary)
                }
            }
        }
        .animation(.easeInOut(duration: 0.3), value: phase)
        .background(Theme.paper.ignoresSafeArea())
        .task(id: attempt) { await load() }
    }

    private func load() async {
        if let cached = history.cache[code] {
            phase = .found(cached)
            return
        }
        phase = .loading
        slow = false
        let timer = Task {
            try? await Task.sleep(for: .seconds(6))
            if !Task.isCancelled { slow = true }
        }
        defer { timer.cancel() }

        do {
            switch try await ProductService.lookup(code, geminiKey: keys.hasKey ? keys.key : nil) {
            case .found(let food):
                history.record(food)
                phase = .found(food)
            case .notFound:
                phase = .notFound
            }
        } catch {
            guard !error.isCancellation else { return }
            phase = .failed(error.friendlyMessage, offline: (error as? AppError) == .offline)
        }
    }
}

struct StateCard<Actions: View>: View {
    let symbol: String
    let title: String
    let message: String
    @ViewBuilder var actions: Actions

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Image(systemName: symbol)
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(Theme.ink2)
                    .frame(width: 52, height: 52)
                    .background(Theme.surface2, in: Circle())
                Text(title)
                    .font(.display(26))
                    .foregroundStyle(Theme.ink)
                Text(message)
                    .foregroundStyle(Theme.ink2)
                    .fixedSize(horizontal: false, vertical: true)
                VStack(spacing: 10) { actions }
                    .padding(.top, 8)
            }
            .card(padding: 24)
            .padding(20)
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// The report's shape, shimmering, while the lookup runs.
struct LoadingReport: View {
    let code: String
    let slow: Bool

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack(alignment: .top, spacing: 16) {
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .fill(Theme.surface3.opacity(0.7))
                        .frame(width: 96, height: 96)
                    VStack(alignment: .leading, spacing: 10) {
                        SkeletonBlock(width: 90, height: 12)
                        SkeletonBlock(height: 24)
                        SkeletonBlock(width: 140, height: 24)
                        SkeletonBlock(width: 110, height: 10)
                    }
                    .padding(.top, 6)
                }
                VStack(alignment: .leading, spacing: 18) {
                    SkeletonBlock(width: 80, height: 10)
                    HStack(spacing: 5) {
                        ForEach(0..<5) { _ in SkeletonBlock(width: 28, height: 34) }
                    }
                    SkeletonBlock(height: 10)
                    SkeletonBlock(width: 200, height: 10)
                }
                .card()
                VStack(alignment: .leading, spacing: 16) {
                    SkeletonBlock(width: 120, height: 18)
                    ForEach(0..<5) { _ in SkeletonBlock(height: 10) }
                }
                .card()

                HStack(spacing: 10) {
                    ProgressView()
                    if slow {
                        Text("Still working. The food database is slow right now.")
                    } else {
                        Text("Looking up ") + Text(code).font(.data(15))
                    }
                }
                .font(.subheadline)
                .foregroundStyle(Theme.ink2)
                .padding(.horizontal, 4)
            }
            .padding(20)
            .shimmering()
        }
        .scrollDisabled(true)
        .navigationBarTitleDisplayMode(.inline)
    }
}
