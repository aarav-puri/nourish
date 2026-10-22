import SwiftUI

@main
struct NourishApp: App {
    @State private var account: Account
    @State private var keys = KeyVault()
    @State private var history: History
    @State private var router = Router()

    init() {
        let account = Account()
        _account = State(initialValue: account)
        _history = State(initialValue: History(account: account))
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(account)
                .environment(keys)
                .environment(history)
                .environment(router)
                .tint(Theme.accent)
        }
    }
}

enum AppTab: Hashable {
    case scan, history, olive, settings
}

enum ScanRoute: Hashable {
    case lookup(String)
    case manual(String)
    case food(Food)
}

/// Which tab is showing and where each tab's navigation stands.
@MainActor
@Observable
final class Router {
    var tab: AppTab = .scan
    var scanPath: [ScanRoute] = []
    var historyPath: [ScanRoute] = []

    func open(_ code: String) {
        tab = .scan
        scanPath = [.lookup(code)]
    }
}

struct RootView: View {
    @Environment(Account.self) private var account
    @Environment(History.self) private var history
    @Environment(Router.self) private var router
    @State private var linkError: String?

    var body: some View {
        Group {
            if !SupabaseConfig.isConfigured {
                MissingConfigView()
            } else if account.isRestoring {
                SplashView()
            } else if !account.isSignedIn {
                WelcomeView()
                    .transition(.opacity)
            } else if !account.hasFinishedSetup {
                SetupView()
                    .transition(.move(edge: .trailing).combined(with: .opacity))
            } else {
                MainTabView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.35), value: account.isSignedIn)
        .animation(.easeInOut(duration: 0.35), value: account.hasFinishedSetup)
        .animation(.easeInOut(duration: 0.35), value: account.isRestoring)
        .task { await account.restore() }
        .onChange(of: account.user?.id) { _, id in
            history.reset()
            router.scanPath = []
            router.historyPath = []
            router.tab = .scan
            if id != nil { Task { await history.refresh() } }
        }
        .onOpenURL { url in
            Task {
                do { try await account.handle(url) } catch { linkError = error.friendlyMessage }
            }
        }
        .sheet(isPresented: Binding(get: { account.needsNewPassword }, set: { account.needsNewPassword = $0 })) {
            NewPasswordView()
        }
        .alert("That link did not work", isPresented: Binding(get: { linkError != nil }, set: { if !$0 { linkError = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(linkError ?? "")
        }
    }
}

struct MainTabView: View {
    @Environment(Router.self) private var router

    var body: some View {
        @Bindable var router = router
        TabView(selection: $router.tab) {
            ScanTab()
                .tag(AppTab.scan)
                .tabItem { Label("Scan", systemImage: "barcode.viewfinder") }
            HistoryView()
                .tag(AppTab.history)
                .tabItem { Label("History", systemImage: "clock.arrow.circlepath") }
            OliveChatView()
                .tag(AppTab.olive)
                .tabItem { Label("Olive", systemImage: "bubble.left.and.text.bubble.right") }
            SettingsView()
                .tag(AppTab.settings)
                .tabItem { Label("Profile", systemImage: "person.crop.circle") }
        }
    }
}

/// Matches the launch screen, so the hand-off is seamless while the stored
/// session is checked.
struct SplashView: View {
    var body: some View {
        ZStack {
            Theme.brand.ignoresSafeArea()
            Image("LaunchMark")
                .resizable()
                .frame(width: 120, height: 120)
            ProgressView()
                .tint(Theme.brandLeaf)
                .offset(y: 120)
        }
    }
}

struct MissingConfigView: View {
    var body: some View {
        VStack(spacing: 20) {
            BrandMark(size: 88, tile: true)
            Text("Connect Supabase")
                .font(.display(28))
                .foregroundStyle(Theme.ink)
            Text("Copy **Config/Secrets.example.xcconfig** to **Config/Secrets.xcconfig**, add your project's host and anon key, then build again.")
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.ink2)
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.paper)
    }
}
