import PhotosUI
import SwiftUI
import UIKit

struct SettingsView: View {
    @Environment(Account.self) private var account
    @Environment(KeyVault.self) private var keys
    @Environment(History.self) private var history

    @State private var photo: PhotosPickerItem?
    @State private var uploading = false
    @State private var confirmSignOut = false
    @State private var confirmDelete = false
    @State private var deleting = false
    @State private var toast: Toast?

    private var version: String {
        let info = Bundle.main.infoDictionary
        return "\(info?["CFBundleShortVersionString"] as? String ?? "") (\(info?["CFBundleVersion"] as? String ?? ""))"
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    profileHeader
                        .listRowBackground(Color.clear)
                        .listRowInsets(EdgeInsets())
                }

                Section("Food profile") {
                    NavigationLink {
                        ProfileEditorView()
                    } label: {
                        row("checkmark.shield.fill", tint: Theme.accent, title: "Diets and allergies", value: profileSummary)
                    }
                }

                Section {
                    NavigationLink {
                        KeyEditorView()
                    } label: {
                        row("key.fill", tint: Color(hex: 0x4285F4), title: "Gemini API key", value: keys.hasKey ? keys.masked : "Not set")
                    }
                } header: {
                    Text("AI")
                } footer: {
                    Text("Olive, smarter swaps, recipes and estimated grades run on your own key. It stays in this iPhone's Keychain.")
                }

                Section("Data") {
                    Link(destination: URL(string: "https://world.openfoodfacts.org")!) {
                        row("globe.europe.africa.fill", tint: Color(hex: 0xFF8714), title: "Open Food Facts", value: "Product data")
                    }
                    NavigationLink {
                        AboutView()
                    } label: {
                        row("info.circle.fill", tint: Theme.ink2, title: "About Nourish", value: version)
                    }
                }

                Section {
                    Button("Sign out") { confirmSignOut = true }
                        .foregroundStyle(Theme.ink)
                    Button(role: .destructive) {
                        confirmDelete = true
                    } label: {
                        if deleting { ProgressView() } else { Text("Delete account") }
                    }
                    .disabled(deleting)
                } footer: {
                    Text("Deleting removes your scans, saved AI answers, photo and account for good.")
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.paper.ignoresSafeArea())
            .navigationTitle("Profile")
            .toast($toast)
            .confirmationDialog("Sign out of Nourish?", isPresented: $confirmSignOut, titleVisibility: .visible) {
                Button("Sign out", role: .destructive) {
                    Task { await account.signOut() }
                }
            }
            .alert("Delete your account?", isPresented: $confirmDelete) {
                Button("Delete", role: .destructive) { Task { await deleteAccount() } }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Your scans, saved AI answers and account are removed for good. This cannot be undone.")
            }
            .onChange(of: photo) { _, item in
                guard let item else { return }
                Task { await upload(item) }
            }
        }
    }

    private var profileSummary: String {
        let profile = account.profile
        if profile.isEmpty { return "Not set" }
        let parts = profile.diets.map(\.label) + profile.avoid.map(Allergen.label(for:))
        return parts.prefix(2).joined(separator: ", ") + (parts.count > 2 ? " +\(parts.count - 2)" : "")
    }

    private var profileHeader: some View {
        VStack(spacing: 12) {
            PhotosPicker(selection: $photo, matching: .images) {
                ZStack(alignment: .bottomTrailing) {
                    AvatarView(user: account.user, size: 96)
                        .overlay {
                            if uploading {
                                Circle().fill(.black.opacity(0.35))
                                ProgressView().tint(.white)
                            }
                        }
                    Image(systemName: "camera.fill")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Theme.onAccent)
                        .frame(width: 30, height: 30)
                        .background(Theme.accent, in: Circle())
                        .overlay(Circle().strokeBorder(Theme.paper, lineWidth: 3))
                }
            }
            .buttonStyle(.pressable)
            .accessibilityLabel("Change photo")
            .contextMenu {
                if account.user?.avatarURL != nil {
                    Button("Remove photo", systemImage: "trash", role: .destructive) {
                        Task {
                            do {
                                try await account.removeAvatar()
                                toast = Toast(message: "Photo removed", style: .success)
                            } catch {
                                toast = Toast(message: error.friendlyMessage, style: .error)
                            }
                        }
                    }
                }
            }

            VStack(spacing: 2) {
                Text(account.user?.displayName ?? "Your profile")
                    .font(.display(24))
                    .foregroundStyle(Theme.ink)
                if let email = account.user?.email {
                    Text(email).font(.subheadline).foregroundStyle(Theme.ink3)
                }
            }

            HStack(spacing: 10) {
                stat("\(history.entries.count)", "scans")
                stat("\(history.entries.filter { $0.food.grade == .a || $0.food.grade == .b }.count)", "graded A or B")
                stat("\(account.profile.diets.count + account.profile.avoid.count)", "rules")
            }
            .padding(.top, 6)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    private func stat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.display(20)).foregroundStyle(Theme.ink)
            Text(label).font(.caption).foregroundStyle(Theme.ink3).lineLimit(1).minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func row(_ symbol: String, tint: Color, title: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: symbol)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 30, height: 30)
                .background(tint, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            Text(title).foregroundStyle(Theme.ink)
            Spacer()
            Text(value)
                .font(.subheadline)
                .foregroundStyle(Theme.ink3)
                .lineLimit(1)
        }
    }

    private func upload(_ item: PhotosPickerItem) async {
        uploading = true
        defer {
            uploading = false
            photo = nil
        }
        do {
            guard let data = try await item.loadTransferable(type: Data.self), let image = UIImage(data: data) else {
                throw AppError("Could not read that image.")
            }
            try await account.uploadAvatar(image)
            toast = Toast(message: "Photo updated", style: .success)
        } catch {
            toast = Toast(message: error.friendlyMessage, style: .error)
        }
    }

    private func deleteAccount() async {
        deleting = true
        defer { deleting = false }
        do {
            try await account.deleteAccount()
            keys.remove()
        } catch {
            toast = Toast(message: error.friendlyMessage, style: .error)
        }
    }
}

struct AvatarView: View {
    let user: AuthUser?
    var size: CGFloat = 40

    var body: some View {
        Group {
            if let url = user?.avatarURL {
                AsyncImage(url: url) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    initials
                }
            } else {
                initials
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
        .accessibilityHidden(true)
    }

    private var initials: some View {
        ZStack {
            Circle().fill(LinearGradient(colors: [Color(hex: 0x356B50), Theme.brandDeep], startPoint: .topLeading, endPoint: .bottomTrailing))
            if let user, !user.initials.isEmpty {
                Text(user.initials)
                    .font(.system(size: size * 0.36, weight: .semibold, design: .rounded))
                    .foregroundStyle(Theme.brandLeaf)
            } else {
                BrandMark(size: size * 0.6, color: Theme.brandLeaf)
            }
        }
    }
}

struct ProfileEditorView: View {
    @Environment(Account.self) private var account
    @Environment(\.dismiss) private var dismiss
    @State private var profile = FoodProfile()
    @State private var name = ""
    @State private var saving = false
    @State private var error: String?

    private var changed: Bool {
        profile != account.profile || name.trimmed != (account.user?.displayName ?? "")
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Text("Every scan checks itself against this.")
                    .foregroundStyle(Theme.ink2)
                VStack(alignment: .leading, spacing: 10) {
                    Text("Name").eyebrow()
                    TextField("Your name", text: $name)
                        .textContentType(.givenName)
                        .padding(.horizontal, 16)
                        .frame(height: 50)
                        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                ProfilePicker(profile: $profile)
                if let error {
                    Text(error).font(.footnote.weight(.medium)).foregroundStyle(Theme.high)
                }
            }
            .padding(20)
        }
        .background(Theme.paper.ignoresSafeArea())
        .navigationTitle("Food profile")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button {
                    Task { await save() }
                } label: {
                    if saving { ProgressView() } else { Text("Save").fontWeight(.semibold) }
                }
                .disabled(!changed || saving)
            }
        }
        .onAppear {
            profile = account.profile
            name = account.user?.displayName ?? ""
        }
    }

    private func save() async {
        saving = true
        defer { saving = false }
        do {
            try await account.saveProfile(profile, displayName: name)
            dismiss()
        } catch {
            self.error = error.friendlyMessage
        }
    }
}

struct KeyEditorView: View {
    @Environment(KeyVault.self) private var keys
    @Environment(\.dismiss) private var dismiss
    @State private var confirmRemove = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 14) {
                    OliveAvatar(size: 52)
                    Text(keys.hasKey ? "Saved as \(keys.masked)" : "No key saved on this iPhone yet.")
                        .font(.data(14))
                        .foregroundStyle(Theme.ink2)
                }
                Text("Nourish calls Google Gemini straight from this iPhone with your key. It is never sent to Nourish's database. Google's free tier covers everyday use.")
                    .foregroundStyle(Theme.ink2)
                GeminiKeyForm(submitLabel: keys.hasKey ? "Replace key" : "Save key") { dismiss() }
                if keys.hasKey {
                    Button("Remove key", role: .destructive) { confirmRemove = true }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 4)
                }
            }
            .padding(20)
        }
        .background(Theme.paper.ignoresSafeArea())
        .navigationTitle("Gemini API key")
        .navigationBarTitleDisplayMode(.inline)
        .confirmationDialog("Remove your Gemini key?", isPresented: $confirmRemove, titleVisibility: .visible) {
            Button("Remove key", role: .destructive) {
                keys.remove()
                dismiss()
            }
        } message: {
            Text("AI features stop until you add a key again.")
        }
    }
}

struct AboutView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                BrandMark(size: 96, tile: true)
                    .shadow(color: Theme.shadow, radius: 20, y: 8)
                    .padding(.top, 24)
                Wordmark(size: 28)
                Text("Scan any food barcode to see its grade, sugar, additives and allergens, checked against your own diet. Free, with no ads.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.ink2)
                VStack(alignment: .leading, spacing: 14) {
                    about("Product data", "Open Food Facts, a free, open and collaborative database of food products from around the world.")
                    about("Grades", "Nutri-Score and Eco-Score as published. When a grade is missing, Gemini estimates it and the app labels it as estimated.")
                    about("Nutrient levels", "UK Food Standards Agency front-of-pack thresholds, per 100g or 100ml.")
                    about("Privacy", "Your history and food profile are stored in your account. Your Gemini key never leaves this iPhone except to call Google.")
                }
                .card()
            }
            .padding(20)
        }
        .background(Theme.paper.ignoresSafeArea())
        .navigationTitle("About")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func about(_ title: String, _ detail: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.ink)
            Text(detail).font(.subheadline).foregroundStyle(Theme.ink2).fixedSize(horizontal: false, vertical: true)
        }
    }
}
