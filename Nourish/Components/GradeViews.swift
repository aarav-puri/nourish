import SwiftUI

extension Grade {
    var color: Color {
        switch self {
        case .a: Color(hex: 0x038141)
        case .b: Color(hex: 0x85BB2F)
        case .c: Color(hex: 0xFECB02)
        case .d: Color(hex: 0xEE8100)
        case .e: Color(hex: 0xE63E11)
        }
    }

    /// A legible letter colour on each step of the ramp.
    var onColor: Color {
        switch self {
        case .a, .e: .white
        case .b: Color(hex: 0x14210A)
        case .c: Color(hex: 0x2B2200)
        case .d: Color(hex: 0x2A1600)
        }
    }
}

extension Level {
    var color: Color {
        switch self {
        case .low: Theme.low
        case .moderate: Theme.moderate
        case .high: Theme.high
        }
    }
}

/// A single grade letter on its colour, for lists and tiles.
struct GradeBadge: View {
    let grade: Grade?
    var size: CGFloat = 36

    var body: some View {
        Group {
            if let grade {
                Text(grade.rawValue.uppercased())
                    .font(.system(size: size * 0.5, weight: .heavy, design: .rounded))
                    .foregroundStyle(grade.onColor)
                    .frame(width: size, height: size)
                    .background(grade.color, in: RoundedRectangle(cornerRadius: size * 0.3, style: .continuous))
            } else {
                Text("?")
                    .font(.data(size * 0.4))
                    .foregroundStyle(Theme.ink3)
                    .frame(width: size, height: size)
                    .overlay(
                        RoundedRectangle(cornerRadius: size * 0.3, style: .continuous)
                            .strokeBorder(Theme.line, style: StrokeStyle(lineWidth: 1.5, dash: [3, 3]))
                    )
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(grade.map { "Grade \($0.rawValue.uppercased())" } ?? "Not graded")
    }
}

/// The A to E scale as printed on packs: every step visible, the product's
/// own grade raised out of the row so its place reads at a glance.
struct GradeScale: View {
    let grade: Grade?
    var label = "Nutri-Score"
    var compact = false

    @State private var appeared = false

    var body: some View {
        HStack(spacing: compact ? 3 : 5) {
            ForEach(Grade.allCases, id: \.self) { step in
                let active = step == grade
                Text(step.rawValue.uppercased())
                    .font(.system(size: active ? (compact ? 18 : 24) : (compact ? 11 : 13), weight: .heavy, design: .rounded))
                    .foregroundStyle(step.onColor)
                    .frame(width: active ? (compact ? 32 : 44) : (compact ? 20 : 28), height: active ? (compact ? 40 : 56) : (compact ? 26 : 34))
                    .background(step.color, in: RoundedRectangle(cornerRadius: active ? 12 : 8, style: .continuous))
                    .opacity(active ? 1 : (grade == nil ? 0.25 : 0.35))
                    .shadow(color: active ? step.color.opacity(0.45) : .clear, radius: 10, y: 4)
                    .scaleEffect(active && !appeared ? 0.6 : 1)
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.6).delay(0.15)) { appeared = true }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(grade.map { "\(label): \($0.rawValue.uppercased()) on a scale from A to E" } ?? "\(label): not graded")
    }
}

#Preview {
    VStack(spacing: 20) {
        GradeScale(grade: .b)
        GradeScale(grade: .d, compact: true)
        HStack { ForEach(Grade.allCases, id: \.self) { GradeBadge(grade: $0) }; GradeBadge(grade: nil) }
    }
    .padding()
}
