import SwiftUI

/// Olive, the Nourish assistant: a small olive hanging from a sage sprig.
/// Idle, it sways and blinks; while thinking it bobs and glances about.
struct OliveAvatar: View {
    var size: CGFloat = 32
    var animated = true
    var thinking = false

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation(paused: !animated || reduceMotion)) { timeline in
            let t = timeline.date.timeIntervalSinceReferenceDate
            Canvas { context, canvasSize in
                draw(in: &context, size: canvasSize, time: animated && !reduceMotion ? t : 0)
            }
        }
        .frame(width: size, height: size)
        .background(Theme.accentSoft, in: Circle())
        .accessibilityHidden(true)
    }

    private func draw(in context: inout GraphicsContext, size: CGSize, time t: Double) {
        let s = size.width / 48
        context.scaleBy(x: s, y: s)

        // Everything hangs from the sprig's tip at (24, 4.5), so it sways from there.
        let sway = thinking ? sin(t * 5) * 6 : sin(t * 1.4) * 4
        let bob = thinking ? sin(t * 7) * 0.8 : 0
        context.translateBy(x: 24, y: 4.5)
        context.rotate(by: .degrees(sway))
        context.translateBy(x: -24, y: -4.5 + bob)

        var stem = Path()
        stem.move(to: CGPoint(x: 24, y: 4.5))
        stem.addCurve(to: CGPoint(x: 25.6, y: 13.5), control1: CGPoint(x: 24, y: 8.5), control2: CGPoint(x: 24.6, y: 11.1))
        context.stroke(stem, with: .color(Theme.accent), style: StrokeStyle(lineWidth: 2, lineCap: .round))

        var leaf = Path()
        leaf.move(to: CGPoint(x: 25, y: 8.5))
        leaf.addCurve(to: CGPoint(x: 38.5, y: 6.3), control1: CGPoint(x: 28.6, y: 4.9), control2: CGPoint(x: 34, y: 4.3))
        leaf.addCurve(to: CGPoint(x: 25, y: 8.5), control1: CGPoint(x: 36.1, y: 10.9), control2: CGPoint(x: 30.9, y: 12.9))
        context.fill(leaf, with: .color(Theme.accent.opacity(0.85)))

        let body = Path(ellipseIn: CGRect(x: 25 - 12.5, y: 28 - 14.5, width: 25, height: 29))
        context.fill(
            body,
            with: .radialGradient(
                Gradient(stops: [
                    .init(color: Color(hex: 0xB7CC7E), location: 0),
                    .init(color: Color(hex: 0x86A24C), location: 0.55),
                    .init(color: Color(hex: 0x5B7731), location: 1),
                ]),
                center: CGPoint(x: 12.5 + 25 * 0.38, y: 13.5 + 29 * 0.32),
                startRadius: 0,
                endRadius: 22
            )
        )

        var shine = context
        shine.translateBy(x: 20, y: 20.5)
        shine.rotate(by: .degrees(-30))
        shine.fill(Path(ellipseIn: CGRect(x: -3.6, y: -2.2, width: 7.2, height: 4.4)), with: .color(.white.opacity(0.35)))

        // Blink for a moment every few seconds; glance side to side while thinking.
        let blinking = t > 0 && t.truncatingRemainder(dividingBy: 4.2) < 0.14
        let eyeHeight: CGFloat = blinking ? 0.5 : 4
        let glance: CGFloat = thinking ? CGFloat(sin(t * 2.5)) * 1.2 : 0
        let eyeColor = Color(hex: 0x24331A)
        for x in [20.6, 29.4] {
            let rect = CGRect(x: x - 1.55 + glance, y: 28 - eyeHeight / 2, width: 3.1, height: eyeHeight)
            context.fill(Path(ellipseIn: rect), with: .color(eyeColor))
        }

        for x in [17.6, 32.4] {
            context.fill(Path(ellipseIn: CGRect(x: x - 1.9, y: 32 - 1.9, width: 3.8, height: 3.8)), with: .color(Color(hex: 0xF2A08B).opacity(0.45)))
        }

        var mouth = Path()
        mouth.move(to: CGPoint(x: 22.6, y: 32.4))
        mouth.addCurve(to: CGPoint(x: 27.4, y: 32.4), control1: CGPoint(x: 24, y: 33.8), control2: CGPoint(x: 26, y: 33.8))
        context.stroke(mouth, with: .color(eyeColor), style: StrokeStyle(lineWidth: 1.4, lineCap: .round))
    }
}

#Preview {
    HStack(spacing: 20) {
        OliveAvatar(size: 64)
        OliveAvatar(size: 64, thinking: true)
    }
}
