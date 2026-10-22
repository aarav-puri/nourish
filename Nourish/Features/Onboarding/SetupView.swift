import SwiftUI
import UIKit

/// After the first sign in: what you eat, then the Gemini key.
struct SetupView: View {
    @Environment(Account.self) private var account
    @Environment(KeyVault.self) private var keys
    @State private var step = 0
    @State private var profile = FoodProfile()
    @State private var name = ""
    @State private var saving = false
    @State private var toast: Toast?

    var body: some View {
        VStack(spacing: 0) {
            header
            TabView(selection: $step) {
                profileStep.tag(0)
                keyStep.tag(1)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.spring(response: 0.45, dampingFraction: 0.9), value: step)
        }
        .background(Theme.paper.ignoresSafeArea())
        .toast($toast)
        .onAppear {
            profile = account.profile
            name = account.user?.displayName ?? ""
        }
    }

    private var header: some View {
        HStack(spacing: 12) {
            if step > 0 {
                Button { step -= 1 } label: {
                    Image(systemName: "chevron.left").font(.system(size: 17, weight: .semibold))
                }
                .foregroundStyle(Theme.ink)
                .accessibilityLabel("Back")
            }
            HStack(spacing: 6) {
                ForEach(0..<2) { index in
                    Capsule()
                        .fill(index <= step ? Theme.accent : Theme.surface3)
                        .frame(height: 5)
                }
            }
            .animation(.easeInOut, value: step)
            Text("\(step + 1) of 2")
                .font(.data(12))
                .foregroundStyle(Theme.ink3)
        }
        .padding(.horizontal, 24)
        .padding(.top, 12)
        .padding(.bottom, 8)
    }

    private var profileStep: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("What do you eat?")
                        .font(.display(32))
                        .foregroundStyle(Theme.ink)
                    Text("Every scan checks itself against this. You can change it any time.")
                        .foregroundStyle(Theme.ink2)
                }

                VStack(alignment: .leading, spacing: 10) {
                    Text("Your name").eyebrow()
                    TextField("Optional", text: $name)
                        .textContentType(.givenName)
                        .padding(.horizontal, 16)
                        .frame(height: 50)
                        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }

                ProfilePicker(profile: $profile)
            }
            .padding(24)
            .padding(.bottom, 100)
        }
        .safeAreaInset(edge: .bottom) {
            Button {
                Task { await saveProfile() }
            } label: {
                if saving { ProgressView().tint(Theme.onAccent) } else { Text(profile.isEmpty ? "Skip for now" : "Continue") }
            }
            .buttonStyle(.primary)
            .disabled(saving)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(.bar)
        }
    }

    private var keyStep: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                HStack(spacing: 14) {
                    OliveAvatar(size: 64)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Meet Olive").font(.display(15, weight: .semibold)).foregroundStyle(Theme.accentInk)
                        Text("Your food guide").font(.subheadline).foregroundStyle(Theme.ink3)
                    }
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text("Bring your own AI key")
                        .font(.display(32))
                        .foregroundStyle(Theme.ink)
                    Text("Olive, smarter swaps, recipes and estimated grades run on Google Gemini with your own free key. It stays on this iPhone, in the Keychain.")
                        .foregroundStyle(Theme.ink2)
                }
                GeminiKeyForm(submitLabel: "Save and start scanning") {
                    finish()
                }
            }
            .padding(24)
        }
        .safeAreaInset(edge: .bottom) {
            Button("I'll do this later") { finish() }
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(Theme.ink2)
                .padding(.vertical, 16)
                .frame(maxWidth: .infinity)
                .background(.bar)
        }
    }

    private func saveProfile() async {
        saving = true
        defer { saving = false }
        do {
            if profile != account.profile || name.trimmed != (account.user?.displayName ?? "") {
                try await account.saveProfile(profile, displayName: name)
            }
            if keys.hasKey { finish() } else { step = 1 }
        } catch {
            toast = Toast(message: error.friendlyMessage, style: .error)
        }
    }

    private func finish() {
        account.hasFinishedSetup = true
    }
}

/// Diets and allergens, as two grids of toggles.
struct ProfilePicker: View {
    @Binding var profile: FoodProfile

    private let columns = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)]

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            VStack(alignment: .leading, spacing: 12) {
                Text("Diets").eyebrow()
                LazyVGrid(columns: columns, spacing: 10) {
                    ForEach(Diet.allCases) { diet in
                        ToggleTile(
                            title: diet.label,
                            detail: diet.hint,
                            symbol: diet.symbol,
                            isOn: profile.diets.contains(diet)
                        ) {
                            if let index = profile.diets.firstIndex(of: diet) { profile.diets.remove(at: index) } else { profile.diets.append(diet) }
                        }
                    }
                }
            }

            VStack(alignment: .leading, spacing: 12) {
                Text("Allergies and avoids").eyebrow()
                FlowLayout(spacing: 8, lineSpacing: 8) {
                    ForEach(Allergen.all) { allergen in
                        let on = profile.avoid.contains(allergen.id)
                        Button {
                            if on { profile.avoid.removeAll { $0 == allergen.id } } else { profile.avoid.append(allergen.id) }
                        } label: {
                            HStack(spacing: 6) {
                                if on { Image(systemName: "checkmark").font(.system(size: 12, weight: .bold)) }
                                Text(allergen.label)
                            }
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(on ? Theme.onAccent : Theme.ink)
                            .padding(.horizontal, 14)
                            .frame(height: 38)
                            .background(on ? Theme.accent : Theme.surface, in: Capsule())
                            .overlay(Capsule().strokeBorder(on ? .clear : Theme.line, lineWidth: 1))
                        }
                        .buttonStyle(.pressable)
                        .accessibilityAddTraits(on ? .isSelected : [])
                    }
                }
            }
        }
        .sensoryFeedback(.selection, trigger: profile)
        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: profile)
    }
}

struct ToggleTile: View {
    let title: String
    let detail: String
    let symbol: String
    let isOn: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Image(systemName: symbol)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(isOn ? Theme.onAccent : Theme.accentInk)
                    Spacer()
                    Image(systemName: isOn ? "checkmark.circle.fill" : "circle")
                        .foregroundStyle(isOn ? Theme.onAccent : Theme.line)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.system(size: 16, weight: .semibold))
                    Text(detail).font(.system(size: 13)).opacity(0.75).lineLimit(1).minimumScaleFactor(0.85)
                }
                .foregroundStyle(isOn ? Theme.onAccent : Theme.ink)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(isOn ? Theme.accent : Theme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(isOn ? .clear : Theme.line, lineWidth: 1))
        }
        .buttonStyle(.pressable)
        .accessibilityAddTraits(isOn ? .isSelected : [])
    }
}

/// Paste, verify against Google, save to the Keychain.
struct GeminiKeyForm: View {
    var submitLabel = "Save key"
    var onSaved: () -> Void = {}

    @Environment(KeyVault.self) private var keys
    @State private var value = ""
    @State private var reveal = false
    @State private var busy = false
    @State private var error: String?
    @State private var notice: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 10) {
                Image(systemName: "key").foregroundStyle(Theme.ink3)
                Group {
                    if reveal { TextField("AIza…", text: $value) } else { SecureField("AIza…", text: $value) }
                }
                .font(.data(15))
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                Button { reveal.toggle() } label: {
                    Image(systemName: reveal ? "eye.slash" : "eye").foregroundStyle(Theme.ink3)
                }
                .accessibilityLabel(reveal ? "Hide key" : "Show key")
                if value.isEmpty {
                    Button {
                        if let pasted = UIPasteboard.general.string { value = pasted.trimmed }
                    } label: {
                        Text("Paste").font(.system(size: 14, weight: .semibold))
                    }
                    .foregroundStyle(Theme.accentInk)
                }
            }
            .padding(.horizontal, 16)
            .frame(height: 54)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(error == nil ? Theme.line : Theme.high, lineWidth: 1))

            if let error {
                Text(error).font(.footnote.weight(.medium)).foregroundStyle(Theme.high)
            } else if let notice {
                Text(notice).font(.footnote.weight(.medium)).foregroundStyle(Theme.low)
            }

            Link(destination: URL(string: "https://aistudio.google.com/apikey")!) {
                Label("Get a free key from Google AI Studio", systemImage: "arrow.up.right.square")
                    .font(.subheadline.weight(.medium))
            }
            .foregroundStyle(Theme.accentInk)

            Button {
                Task { await save() }
            } label: {
                if busy { ProgressView().tint(Theme.onAccent) } else { Text(submitLabel) }
            }
            .buttonStyle(.primary)
            .disabled(value.trimmed.isEmpty || busy)
        }
        .onAppear { value = keys.key }
    }

    private func save() async {
        let key = value.trimmed
        busy = true
        error = nil
        defer { busy = false }
        switch await Gemini.verify(key) {
        case .invalid:
            error = "Google did not accept this key. Copy it again from AI Studio."
        case .ok:
            keys.save(key)
            notice = "Key verified and saved."
            onSaved()
        case .unreachable:
            keys.save(key)
            notice = "Saved. We could not reach Google to verify it just now."
            onSaved()
        }
    }
}
