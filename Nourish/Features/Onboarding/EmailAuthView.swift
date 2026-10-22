import SwiftUI

struct EmailAuthView: View {
    enum Mode: String, CaseIterable { case signIn = "Sign in", signUp = "Create account" }
    enum Field { case email, password }

    @Environment(Account.self) private var account
    @Environment(\.dismiss) private var dismiss
    @State private var mode: Mode = .signIn
    @State private var email = ""
    @State private var password = ""
    @State private var busy = false
    @State private var error: String?
    @State private var notice: String?
    @FocusState private var focus: Field?

    private var valid: Bool {
        email.contains("@") && email.contains(".") && password.count >= (mode == .signUp ? 8 : 1)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    BrandMark(size: 56, tile: true)
                        .padding(.top, 8)

                    VStack(alignment: .leading, spacing: 6) {
                        Text(mode == .signIn ? "Welcome back" : "Create your account")
                            .font(.display(30))
                            .foregroundStyle(Theme.ink)
                        Text(mode == .signIn ? "Your scans and food profile are waiting." : "Keep your history and food profile on every device.")
                            .foregroundStyle(Theme.ink2)
                    }

                    Picker("Mode", selection: $mode) {
                        ForEach(Mode.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    VStack(spacing: 12) {
                        field(icon: "envelope") {
                            TextField("Email", text: $email)
                                .textContentType(.emailAddress)
                                .keyboardType(.emailAddress)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .focused($focus, equals: .email)
                                .submitLabel(.next)
                                .onSubmit { focus = .password }
                        }
                        field(icon: "lock") {
                            SecureField(mode == .signUp ? "Password, 8 or more characters" : "Password", text: $password)
                                .textContentType(mode == .signUp ? .newPassword : .password)
                                .focused($focus, equals: .password)
                                .submitLabel(.go)
                                .onSubmit { Task { await submit() } }
                        }
                    }

                    if let error {
                        Label(error, systemImage: "exclamationmark.circle.fill")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(Theme.high)
                            .transition(.opacity)
                    }
                    if let notice {
                        Label(notice, systemImage: "envelope.badge")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(Theme.low)
                            .transition(.opacity)
                    }

                    Button {
                        Task { await submit() }
                    } label: {
                        if busy { ProgressView().tint(Theme.onAccent) } else { Text(mode.rawValue) }
                    }
                    .buttonStyle(.primary)
                    .disabled(!valid || busy)

                    if mode == .signIn {
                        Button("Forgot your password?") { Task { await reset() } }
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(Theme.accentInk)
                            .frame(maxWidth: .infinity)
                    }
                }
                .padding(24)
                .animation(.easeInOut(duration: 0.2), value: error)
                .animation(.easeInOut(duration: 0.2), value: notice)
            }
            .scrollDismissesKeyboard(.interactively)
            .background(Theme.paper)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onChange(of: mode) { error = nil; notice = nil }
            .onAppear { focus = .email }
        }
    }

    private func field<Content: View>(icon: String, @ViewBuilder content: () -> Content) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(Theme.ink3)
                .frame(width: 20)
            content()
        }
        .padding(.horizontal, 16)
        .frame(height: 54)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(Theme.line, lineWidth: 1))
    }

    private func submit() async {
        guard valid, !busy else { return }
        busy = true
        error = nil
        notice = nil
        defer { busy = false }
        do {
            switch mode {
            case .signIn:
                try await account.signIn(email: email, password: password)
                dismiss()
            case .signUp:
                if try await account.signUp(email: email, password: password) {
                    dismiss()
                } else {
                    notice = "Check your inbox to confirm your email, then sign in."
                    mode = .signIn
                }
            }
        } catch {
            self.error = error.friendlyMessage
        }
    }

    private func reset() async {
        guard email.contains("@") else {
            error = "Enter your email first, then tap this again."
            focus = .email
            return
        }
        do {
            try await account.sendPasswordReset(email: email)
            error = nil
            notice = "If that email has an account, a reset link is on its way. Open it on this iPhone."
        } catch {
            self.error = error.friendlyMessage
        }
    }
}

/// Shown after a password reset link opens the app.
struct NewPasswordView: View {
    @Environment(Account.self) private var account
    @Environment(\.dismiss) private var dismiss
    @State private var password = ""
    @State private var busy = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 18) {
                Text("Choose a new password")
                    .font(.display(28))
                    .foregroundStyle(Theme.ink)
                SecureField("New password, 8 or more characters", text: $password)
                    .textContentType(.newPassword)
                    .padding(.horizontal, 16)
                    .frame(height: 54)
                    .background(Theme.surface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                if let error {
                    Text(error).font(.subheadline).foregroundStyle(Theme.high)
                }
                Button {
                    Task {
                        busy = true
                        defer { busy = false }
                        do {
                            try await account.updatePassword(password)
                            dismiss()
                        } catch {
                            self.error = error.friendlyMessage
                        }
                    }
                } label: {
                    if busy { ProgressView().tint(Theme.onAccent) } else { Text("Save password") }
                }
                .buttonStyle(.primary)
                .disabled(password.count < 8 || busy)
                Spacer()
            }
            .padding(24)
            .background(Theme.paper)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Later") { dismiss() } }
            }
        }
        .presentationDetents([.medium])
    }
}
