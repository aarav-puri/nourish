import SwiftUI

/// First launch: the sprout draws itself in, then sign in.
struct WelcomeView: View {
    @Environment(Account.self) private var account
    @State private var drawn: CGFloat = 0
    @State private var showContent = false
    @State private var emailSheet = false
    @State private var googleBusy = false
    @State private var toast: Toast?

    var body: some View {
        ZStack {
            background

            VStack(spacing: 0) {
                Spacer(minLength: 40)

                BrandMark(size: 112, color: Theme.brandLeaf, progress: drawn)
                    .shadow(color: .black.opacity(0.15), radius: 20, y: 10)

                Text("nourish")
                    .font(.system(size: 46, weight: .semibold, design: .rounded))
                    .tracking(-2)
                    .foregroundStyle(Theme.brandLeaf)
                    .padding(.top, 18)
                    .opacity(showContent ? 1 : 0)
                    .offset(y: showContent ? 0 : 12)

                Text("Know what is in your food.")
                    .font(.system(size: 19, weight: .medium, design: .rounded))
                    .foregroundStyle(Theme.brandLeaf.opacity(0.75))
                    .padding(.top, 6)
                    .opacity(showContent ? 1 : 0)
                    .offset(y: showContent ? 0 : 12)

                VStack(alignment: .leading, spacing: 18) {
                    feature("barcode.viewfinder", "Scan any barcode", "Grade, sugar, additives and allergens in a second.")
                    feature("checkmark.shield", "Checked against you", "Every scan is matched to your diet and allergies.")
                    feature("sparkles", "Ask Olive", "Swaps, recipes and answers from your own history.")
                }
                .padding(.top, 44)
                .padding(.horizontal, 8)
                .opacity(showContent ? 1 : 0)
                .offset(y: showContent ? 0 : 20)

                Spacer(minLength: 32)

                VStack(spacing: 12) {
                    Button {
                        Task { await signInWithGoogle() }
                    } label: {
                        HStack(spacing: 10) {
                            if googleBusy {
                                ProgressView().tint(Theme.brandDeep)
                            } else {
                                GoogleGlyph().frame(width: 20, height: 20)
                            }
                            Text("Continue with Google")
                        }
                    }
                    .buttonStyle(PrimaryButtonStyle(fill: .white, foreground: Color(hex: 0x1F2A24)))
                    .disabled(googleBusy)

                    Button("Continue with email") { emailSheet = true }
                        .buttonStyle(PrimaryButtonStyle(fill: .white.opacity(0.14), foreground: Theme.brandLeaf))

                    Text("Free, with no ads. Product data from Open Food Facts.")
                        .font(.footnote)
                        .foregroundStyle(Theme.brandLeaf.opacity(0.6))
                        .padding(.top, 6)
                }
                .opacity(showContent ? 1 : 0)
                .offset(y: showContent ? 0 : 30)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 12)
        }
        .toast($toast)
        .sheet(isPresented: $emailSheet) {
            EmailAuthView()
                .presentationDetents([.large])
                .presentationCornerRadius(28)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.1)) { drawn = 1 }
            withAnimation(.spring(response: 0.7, dampingFraction: 0.85).delay(0.6)) { showContent = true }
        }
    }

    private var background: some View {
        ZStack {
            LinearGradient(colors: [Color(hex: 0x356B50), Theme.brand, Theme.brandDeep], startPoint: .top, endPoint: .bottom)
            // Soft light pooling behind the mark.
            RadialGradient(colors: [Theme.brandLeaf.opacity(0.18), .clear], center: .init(x: 0.5, y: 0.2), startRadius: 0, endRadius: 320)
        }
        .ignoresSafeArea()
    }

    private func feature(_ symbol: String, _ title: String, _ detail: String) -> some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: symbol)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(Theme.brandDeep)
                .frame(width: 40, height: 40)
                .background(Theme.brandLeaf, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.system(size: 17, weight: .semibold)).foregroundStyle(.white)
                Text(detail).font(.system(size: 15)).foregroundStyle(Theme.brandLeaf.opacity(0.75))
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
    }

    private func signInWithGoogle() async {
        googleBusy = true
        defer { googleBusy = false }
        do {
            try await account.signInWithGoogle()
        } catch {
            if !error.isCancellation { toast = Toast(message: error.friendlyMessage, style: .error) }
        }
    }
}

/// Google's four-colour "G", drawn so no image asset is needed.
struct GoogleGlyph: View {
    var body: some View {
        Canvas { context, size in
            let s = size.width / 24
            context.scaleBy(x: s, y: s)
            func path(_ build: (inout Path) -> Void) -> Path { var p = Path(); build(&p); return p }
            context.fill(path { p in
                p.move(to: CGPoint(x: 22.56, y: 12.25)); p.addCurve(to: CGPoint(x: 22.36, y: 10), control1: CGPoint(x: 22.56, y: 11.47), control2: CGPoint(x: 22.49, y: 10.72))
                p.addLine(to: CGPoint(x: 12, y: 10)); p.addLine(to: CGPoint(x: 12, y: 14.26)); p.addLine(to: CGPoint(x: 17.92, y: 14.26))
                p.addCurve(to: CGPoint(x: 15.71, y: 17.57), control1: CGPoint(x: 17.66, y: 15.63), control2: CGPoint(x: 16.88, y: 16.79))
                p.addLine(to: CGPoint(x: 15.71, y: 20.34)); p.addLine(to: CGPoint(x: 19.28, y: 20.34))
                p.addCurve(to: CGPoint(x: 22.56, y: 12.25), control1: CGPoint(x: 21.36, y: 18.42), control2: CGPoint(x: 22.56, y: 15.6))
            }, with: .color(Color(hex: 0x4285F4)))
            context.fill(path { p in
                p.move(to: CGPoint(x: 12, y: 23)); p.addCurve(to: CGPoint(x: 19.28, y: 20.34), control1: CGPoint(x: 14.97, y: 23), control2: CGPoint(x: 17.46, y: 22.02))
                p.addLine(to: CGPoint(x: 15.71, y: 17.57)); p.addCurve(to: CGPoint(x: 12, y: 18.63), control1: CGPoint(x: 14.73, y: 18.23), control2: CGPoint(x: 13.48, y: 18.63))
                p.addCurve(to: CGPoint(x: 5.84, y: 14.1), control1: CGPoint(x: 9.14, y: 18.63), control2: CGPoint(x: 6.71, y: 16.7))
                p.addLine(to: CGPoint(x: 2.18, y: 14.1)); p.addLine(to: CGPoint(x: 2.18, y: 16.94))
                p.addCurve(to: CGPoint(x: 12, y: 23), control1: CGPoint(x: 3.99, y: 20.53), control2: CGPoint(x: 7.7, y: 23))
            }, with: .color(Color(hex: 0x34A853)))
            context.fill(path { p in
                p.move(to: CGPoint(x: 5.84, y: 14.09)); p.addCurve(to: CGPoint(x: 5.49, y: 12), control1: CGPoint(x: 5.62, y: 13.43), control2: CGPoint(x: 5.49, y: 12.73))
                p.addCurve(to: CGPoint(x: 5.84, y: 9.91), control1: CGPoint(x: 5.49, y: 11.27), control2: CGPoint(x: 5.62, y: 10.57))
                p.addLine(to: CGPoint(x: 5.84, y: 7.07)); p.addLine(to: CGPoint(x: 2.18, y: 7.07))
                p.addCurve(to: CGPoint(x: 1, y: 12), control1: CGPoint(x: 1.43, y: 8.55), control2: CGPoint(x: 1, y: 10.22))
                p.addCurve(to: CGPoint(x: 2.18, y: 16.93), control1: CGPoint(x: 1, y: 13.78), control2: CGPoint(x: 1.43, y: 15.45))
                p.addLine(to: CGPoint(x: 5.84, y: 14.09))
            }, with: .color(Color(hex: 0xFBBC05)))
            context.fill(path { p in
                p.move(to: CGPoint(x: 12, y: 5.38)); p.addCurve(to: CGPoint(x: 16.21, y: 7.02), control1: CGPoint(x: 13.62, y: 5.38), control2: CGPoint(x: 15.06, y: 5.94))
                p.addLine(to: CGPoint(x: 19.36, y: 3.87)); p.addCurve(to: CGPoint(x: 12, y: 1), control1: CGPoint(x: 17.45, y: 2.09), control2: CGPoint(x: 14.97, y: 1))
                p.addCurve(to: CGPoint(x: 2.18, y: 7.07), control1: CGPoint(x: 7.7, y: 1), control2: CGPoint(x: 3.99, y: 3.47))
                p.addLine(to: CGPoint(x: 5.84, y: 9.91)); p.addCurve(to: CGPoint(x: 12, y: 5.38), control1: CGPoint(x: 6.71, y: 7.31), control2: CGPoint(x: 9.14, y: 5.38))
            }, with: .color(Color(hex: 0xEA4335)))
        }
        .accessibilityHidden(true)
    }
}

#Preview {
    WelcomeView()
        .environment(Account())
}
