import SwiftUI
import UIKit

/// Olive: questions answered from the person's own scan history.
struct OliveChatView: View {
    struct Message: Identifiable, Equatable {
        let id = UUID()
        let role: ChatMessage.Role
        var text: String
        /// Seconds the reply took.
        var took: Double?
    }

    @Environment(History.self) private var history
    @Environment(KeyVault.self) private var keys
    @Environment(Router.self) private var router

    @State private var messages: [Message] = []
    @State private var input = ""
    @State private var thinking = false
    /// The reply still typing itself out, and how much of it shows.
    @State private var streamingID: UUID?
    @State private var revealed = 0
    @State private var error: String?
    @FocusState private var composing: Bool

    private static let suggestions = [
        "Which of my scans is the healthiest?",
        "Which ones are vegan?",
        "What should I swap first?",
        "Which are highest in protein?",
    ]

    private var busy: Bool { thinking || streamingID != nil }

    var body: some View {
        NavigationStack {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 14) {
                        intro
                        ForEach(messages) { message in
                            bubble(message).id(message.id)
                        }
                        if thinking {
                            HStack(spacing: 10) {
                                OliveAvatar(size: 30, thinking: true)
                                TypingDots()
                            }
                            .id("thinking")
                            .transition(.opacity)
                        }
                        if let error {
                            Label(error, systemImage: "exclamationmark.triangle.fill")
                                .font(.footnote.weight(.medium))
                                .foregroundStyle(Theme.high)
                        }
                        if !busy && !followUps.isEmpty && keys.hasKey {
                            suggestionChips.id("suggestions")
                        }
                        Color.clear.frame(height: 4).id("bottom")
                    }
                    .padding(16)
                }
                .scrollDismissesKeyboard(.interactively)
                .onChange(of: messages) { scrollToBottom(proxy) }
                .onChange(of: thinking) { scrollToBottom(proxy) }
                .onChange(of: revealed) { proxy.scrollTo("bottom", anchor: .bottom) }
            }
            .background(Theme.paper.ignoresSafeArea())
            .safeAreaInset(edge: .bottom) { composer }
            .navigationTitle("Olive")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if !messages.isEmpty {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            withAnimation { messages = []; error = nil }
                        } label: {
                            Image(systemName: "square.and.pencil")
                        }
                        .accessibilityLabel("New conversation")
                        .disabled(busy)
                    }
                }
            }
        }
    }

    // MARK: Pieces

    private var intro: some View {
        VStack(spacing: 12) {
            OliveAvatar(size: 84)
                .padding(.top, 16)
            Text("Hi, I'm Olive")
                .font(.display(26))
                .foregroundStyle(Theme.ink)
            Text(introText)
                .font(.subheadline)
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.ink2)
                .padding(.horizontal, 24)
            if !keys.hasKey {
                Button("Add your Gemini key") { router.tab = .settings }
                    .buttonStyle(.primary)
                    .frame(width: 240)
                    .padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.bottom, 12)
    }

    private var introText: String {
        let count = history.entries.count
        if !keys.hasKey { return "I answer questions about the food you scan. I run on your own Gemini key, so add one to start." }
        if count == 0 { return "Scan a few products and I can compare them, spot allergens and suggest swaps." }
        return "I can see your \(count) scanned product\(count == 1 ? "" : "s"). Ask me anything about them."
    }

    private var followUps: [String] {
        let asked = Set(messages.filter { $0.role == .user }.map(\.text))
        let remaining = Self.suggestions.filter { !asked.contains($0) }
        return messages.isEmpty ? remaining : Array(remaining.prefix(2))
    }

    private var suggestionChips: some View {
        FlowLayout(spacing: 8, lineSpacing: 8) {
            ForEach(followUps, id: \.self) { question in
                Button { send(question) } label: {
                    Text(question)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Theme.accentInk)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 9)
                        .background(Theme.accentSoft, in: Capsule())
                }
                .buttonStyle(.pressable)
            }
        }
    }

    @ViewBuilder
    private func bubble(_ message: Message) -> some View {
        if message.role == .user {
            HStack {
                Spacer(minLength: 48)
                Text(message.text)
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.onAccent)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 11)
                    .background(Theme.accent, in: BubbleShape(mine: true))
            }
            .transition(.move(edge: .bottom).combined(with: .opacity))
        } else {
            HStack(alignment: .top, spacing: 10) {
                OliveAvatar(size: 30, animated: false)
                VStack(alignment: .leading, spacing: 6) {
                    let shown = message.id == streamingID ? String(message.text.prefix(revealed)) : message.text
                    Text(shown)
                        .font(.system(size: 16))
                        .foregroundStyle(Theme.ink)
                        .textSelection(.enabled)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 11)
                        .background(Theme.surface, in: BubbleShape(mine: false))
                        .shadow(color: Theme.shadow, radius: 8, y: 3)
                    if let took = message.took, message.id != streamingID {
                        HStack(spacing: 12) {
                            Text("Thought for \(String(format: "%.1f", took))s")
                            Button {
                                UIPasteboard.general.string = message.text
                            } label: {
                                Image(systemName: "doc.on.doc")
                            }
                            .accessibilityLabel("Copy reply")
                        }
                        .font(.caption)
                        .foregroundStyle(Theme.ink3)
                        .padding(.leading, 6)
                    }
                }
                Spacer(minLength: 24)
            }
            .transition(.opacity)
        }
    }

    private var composer: some View {
        HStack(alignment: .bottom, spacing: 10) {
            TextField(keys.hasKey ? "Ask Olive about your food" : "Add a Gemini key to chat", text: $input, axis: .vertical)
                .lineLimit(1...5)
                .focused($composing)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).strokeBorder(Theme.line, lineWidth: 1))
                .disabled(!keys.hasKey)
                .onSubmit { send(input) }
            Button { send(input) } label: {
                Image(systemName: "arrow.up")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(Theme.onAccent)
                    .frame(width: 44, height: 44)
                    .background(Theme.accent, in: Circle())
            }
            .disabled(input.trimmed.isEmpty || busy || !keys.hasKey)
            .opacity(input.trimmed.isEmpty || busy ? 0.4 : 1)
            .accessibilityLabel("Send")
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(.bar)
    }

    private func scrollToBottom(_ proxy: ScrollViewProxy) {
        withAnimation(.easeOut(duration: 0.25)) { proxy.scrollTo("bottom", anchor: .bottom) }
    }

    // MARK: Sending

    private func send(_ text: String) {
        let question = text.trimmed
        guard !question.isEmpty, !busy, keys.hasKey else { return }
        error = nil
        input = ""
        let previous = messages
        withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
            messages.append(Message(role: .user, text: question))
            thinking = true
        }
        let started = Date()

        Task {
            do {
                let gemini = try Gemini(key: keys.key)
                var thread = [ChatMessage(role: .system, content: systemPrompt())]
                thread += (previous + [Message(role: .user, text: question)]).map { ChatMessage(role: $0.role, content: $0.text) }
                let reply = Self.clean(try await gemini.complete(thread, temperature: 0.7, maxTokens: 500))
                let message = Message(role: .assistant, text: reply, took: Date().timeIntervalSince(started))
                withAnimation { thinking = false; messages.append(message) }
                await typeOut(message)
            } catch {
                withAnimation {
                    thinking = false
                    messages = previous
                }
                input = question
                self.error = error.friendlyMessage
            }
        }
    }

    /// Reveals a reply a few characters at a time, like it is being written.
    private func typeOut(_ message: Message) async {
        streamingID = message.id
        revealed = 0
        let step = max(3, message.text.count / 80)
        while revealed < message.text.count {
            revealed += step
            try? await Task.sleep(for: .milliseconds(18))
        }
        streamingID = nil
    }

    private func systemPrompt() -> String {
        var prompt = """
        You are Olive, the friendly in-app food guide for Nourish, a food scanning app. If asked your name, you are Olive. You help users understand their scanned products and make healthier choices.

        You have access to the user's scan history including product names, barcodes, ingredients and nutrition information.

        IMPORTANT FORMATTING RULES:
        - Write in clean, plain prose without any markdown formatting
        - Do NOT use asterisks, bold text, or special formatting characters
        - Do NOT use bullet points with dashes or asterisks
        - Use simple numbered lists when needed (1., 2., 3.)
        - Keep responses SHORT and CONCISE, 2-3 sentences maximum

        When answering questions:
        - Be brief and direct
        - Reference specific products from their history when relevant
        - Provide actionable insights
        - Use a friendly, conversational tone
        - If asked about products they haven't scanned, politely let them know you can only see their scan history
        """
        let products: [JSONValue] = history.entries.prefix(40).map { entry in
            let food = entry.food
            let n = food.nutrition
            return [
                "name": .string(food.name),
                "brand": JSONValue(food.brand),
                "barcode": .string(food.barcode),
                "nutri_score": JSONValue(food.grade?.rawValue.uppercased()),
                "nova": JSONValue(food.nova.map { Double($0) }),
                "per": .string(food.unit),
                "kcal": JSONValue(n.energyKcal),
                "sugars_g": JSONValue(n.sugars),
                "sat_fat_g": JSONValue(n.saturatedFat),
                "salt_g": JSONValue(n.salt),
                "protein_g": JSONValue(n.protein),
                "fibre_g": JSONValue(n.fiber),
                "allergens": JSONValue(food.allergens),
                "vegan": .string(food.vegan.map { "\($0)" } ?? "unknown"),
                "ingredients": JSONValue(food.ingredientsText.map { String($0.prefix(400)) }),
                "scanned": .string(entry.scannedAt.formatted(date: .abbreviated, time: .omitted)),
            ]
        }
        if !products.isEmpty {
            prompt += "\n\nUser's Scan History:\n\(JSONValue.array(products).jsonString)"
        }
        return prompt
    }

    /// Strips the markdown the model sometimes adds anyway.
    static func clean(_ text: String) -> String {
        var out = text
        out = Pattern(#"\*\*([^*]+)\*\*"#).replacing(in: out, with: "$1")
        out = Pattern(#"\*([^*]+)\*"#).replacing(in: out, with: "$1")
        out = Pattern(#"__([^_]+)__"#).replacing(in: out, with: "$1")
        out = Pattern(#"(?m)^\s*[-*]\s+"#).replacing(in: out, with: "")
        out = Pattern(#"\n{3,}"#).replacing(in: out, with: "\n\n")
        return out.trimmed
    }
}

/// A chat bubble with one tighter corner, toward the speaker.
struct BubbleShape: Shape {
    let mine: Bool

    func path(in rect: CGRect) -> Path {
        let big: CGFloat = 20
        let small: CGFloat = 6
        return Path(
            roundedRect: rect,
            cornerRadii: RectangleCornerRadii(
                topLeading: mine ? big : small,
                bottomLeading: big,
                bottomTrailing: big,
                topTrailing: mine ? small : big
            ),
            style: .continuous
        )
    }
}

struct TypingDots: View {
    var body: some View {
        TimelineView(.animation) { timeline in
            let t = timeline.date.timeIntervalSinceReferenceDate
            HStack(spacing: 5) {
                ForEach(0..<3) { index in
                    Circle()
                        .fill(Theme.ink3)
                        .frame(width: 7, height: 7)
                        .offset(y: sin(t * 6 - Double(index) * 0.8) * 3)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(Theme.surface, in: BubbleShape(mine: false))
        }
        .accessibilityLabel("Olive is typing")
    }
}
