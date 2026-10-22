import SwiftUI

struct HistoryView: View {
    @Environment(History.self) private var history
    @Environment(Router.self) private var router
    @State private var search = ""
    @State private var confirmClear = false
    @State private var toast: Toast?

    private var filtered: [ScanEntry] {
        let query = search.trimmed.lowercased()
        guard !query.isEmpty else { return history.entries }
        return history.entries.filter {
            $0.food.name.lowercased().contains(query)
                || ($0.food.brand?.lowercased().contains(query) ?? false)
                || $0.food.barcode.contains(query)
        }
    }

    /// Today, Yesterday, This week, then by month.
    private var sections: [HistorySection] {
        let calendar = Calendar.current
        var order: [String] = []
        var groups: [String: [ScanEntry]] = [:]
        for entry in filtered {
            let date = entry.scannedAt
            let title: String
            if calendar.isDateInToday(date) { title = "Today" }
            else if calendar.isDateInYesterday(date) { title = "Yesterday" }
            else if let days = calendar.dateComponents([.day], from: date, to: .now).day, days < 7 { title = "This week" }
            else { title = date.formatted(.dateTime.month(.wide).year()) }
            if groups[title] == nil { order.append(title) }
            groups[title, default: []].append(entry)
        }
        return order.map { HistorySection(title: $0, entries: groups[$0] ?? []) }
    }

    var body: some View {
        @Bindable var router = router
        NavigationStack(path: $router.historyPath) {
            Group {
                if history.entries.isEmpty {
                    emptyState
                } else {
                    list
                }
            }
            .background(Theme.paper.ignoresSafeArea())
            .navigationTitle("History")
            .toolbar {
                if !history.entries.isEmpty {
                    ToolbarItem(placement: .topBarTrailing) {
                        Menu {
                            Button("Clear all history", systemImage: "trash", role: .destructive) { confirmClear = true }
                        } label: {
                            Image(systemName: "ellipsis.circle")
                        }
                    }
                }
            }
            .navigationDestination(for: ScanRoute.self) { route in
                switch route {
                case .food(let food): ProductView(food: food)
                case .lookup(let code): LookupView(code: code)
                case .manual(let code): ManualEntryView(barcode: code)
                }
            }
            .confirmationDialog("Clear all history?", isPresented: $confirmClear, titleVisibility: .visible) {
                Button("Clear history", role: .destructive) {
                    Task {
                        do {
                            try await history.clearAll()
                            toast = Toast(message: "History cleared", style: .success)
                        } catch {
                            toast = Toast(message: error.friendlyMessage, style: .error)
                        }
                    }
                }
            } message: {
                Text("Every scan and saved AI answer is removed from your account. This cannot be undone.")
            }
            .toast($toast)
        }
    }

    private var list: some View {
        List {
            if search.isEmpty {
                Section {
                    HistoryStats(entries: history.entries)
                        .listRowInsets(EdgeInsets())
                        .listRowBackground(Color.clear)
                }
            }
            ForEach(sections) { section in
                Section {
                    ForEach(section.entries) { entry in
                        NavigationLink(value: ScanRoute.food(entry.food)) {
                            HistoryRow(entry: entry)
                        }
                        .listRowBackground(Theme.surface)
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) {
                                Task {
                                    do { try await history.delete(entry) } catch {
                                        toast = Toast(message: "Could not delete that scan. It is back in your list.", style: .error)
                                    }
                                }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                } header: {
                    Text(section.title)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Theme.ink3)
                }
            }
            if !search.isEmpty && filtered.isEmpty {
                ContentUnavailableView.search(text: search)
                    .listRowBackground(Color.clear)
            }
        }
        .scrollContentBackground(.hidden)
        .searchable(text: $search, prompt: "Search your scans")
        .refreshable { await history.refresh() }
        .animation(.default, value: history.entries)
    }

    private var emptyState: some View {
        ScrollView {
            VStack(spacing: 16) {
                if history.isLoading && !history.hasLoaded {
                    ProgressView().padding(.top, 120)
                } else {
                    BrandMark(size: 72, tile: true)
                        .padding(.top, 80)
                    Text("Your scans will collect here")
                        .font(.display(24))
                        .foregroundStyle(Theme.ink)
                    Text(history.loadError ?? "Every product you scan is saved to your account, with its grade and any AI answers.")
                        .multilineTextAlignment(.center)
                        .foregroundStyle(Theme.ink2)
                        .padding(.horizontal, 32)
                    Button {
                        router.tab = .scan
                    } label: {
                        Label("Scan your first product", systemImage: "barcode.viewfinder")
                    }
                    .buttonStyle(.primary)
                    .frame(width: 280)
                    .padding(.top, 8)
                }
            }
            .frame(maxWidth: .infinity)
        }
        .refreshable { await history.refresh() }
    }
}

struct HistorySection: Identifiable {
    var id: String { title }
    let title: String
    let entries: [ScanEntry]
}

struct HistoryRow: View {
    let entry: ScanEntry

    var body: some View {
        HStack(spacing: 14) {
            ProductThumb(url: entry.food.image, size: 52)
            VStack(alignment: .leading, spacing: 3) {
                Text(entry.food.name)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Theme.ink)
                    .lineLimit(2)
                HStack(spacing: 6) {
                    if let brand = entry.food.displayBrand {
                        Text(brand).lineLimit(1)
                        Text("·")
                    }
                    Text(relativeTime(entry.scannedAt))
                    if entry.count > 1 {
                        Text("·")
                        Text("\(entry.count)×").font(.data(12))
                    }
                }
                .font(.system(size: 13))
                .foregroundStyle(Theme.ink3)
            }
            Spacer(minLength: 8)
            GradeBadge(grade: entry.food.grade, size: 34)
        }
        .padding(.vertical, 4)
    }
}

/// A glance at the shape of what you buy.
struct HistoryStats: View {
    let entries: [ScanEntry]

    private var graded: [Grade] { entries.compactMap(\.food.grade) }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(entries.count)")
                        .font(.display(34))
                        .foregroundStyle(Theme.ink)
                    Text(entries.count == 1 ? "product scanned" : "products scanned")
                        .font(.subheadline)
                        .foregroundStyle(Theme.ink2)
                }
                Spacer()
                if !graded.isEmpty {
                    let good = graded.filter { $0 == .a || $0 == .b }.count
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("\(Int((Double(good) / Double(graded.count) * 100).rounded()))%")
                            .font(.display(34))
                            .foregroundStyle(Theme.low)
                        Text("graded A or B")
                            .font(.subheadline)
                            .foregroundStyle(Theme.ink2)
                    }
                }
            }
            if !graded.isEmpty {
                GeometryReader { proxy in
                    HStack(spacing: 3) {
                        ForEach(Grade.allCases, id: \.self) { grade in
                            let count = graded.filter { $0 == grade }.count
                            if count > 0 {
                                RoundedRectangle(cornerRadius: 4, style: .continuous)
                                    .fill(grade.color)
                                    .frame(width: max(8, (proxy.size.width - 12) * CGFloat(count) / CGFloat(graded.count)))
                                    .overlay {
                                        Text(grade.rawValue.uppercased())
                                            .font(.system(size: 10, weight: .heavy, design: .rounded))
                                            .foregroundStyle(grade.onColor)
                                    }
                            }
                        }
                    }
                }
                .frame(height: 18)
            }
        }
        .card(padding: 18)
        .padding(.vertical, 4)
    }
}
