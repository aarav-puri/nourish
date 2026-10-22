import SwiftUI

/// The Nourish sprout: the "n" initial opening into a leaf, drawn from the
/// same 64-unit path as the web logo.
struct SproutShape: Shape {
    func path(in rect: CGRect) -> Path {
        let s = min(rect.width, rect.height) / 64
        let ox = rect.midX - 32 * s
        let oy = rect.midY - 32 * s
        func p(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: ox + x * s, y: oy + y * s) }

        var path = Path()
        path.move(to: p(17, 47))
        path.addLine(to: p(17, 32))
        path.addCurve(to: p(39, 32), control1: p(17, 20), control2: p(39, 20))
        path.addLine(to: p(39, 47))
        path.move(to: p(39, 28))
        path.addCurve(to: p(51, 13), control1: p(39, 17), control2: p(48, 13))
        path.addCurve(to: p(39, 28), control1: p(51, 23), control2: p(46, 29))
        path.closeSubpath()
        return path
    }
}

struct BrandMark: View {
    var size: CGFloat = 64
    /// Draws the sage app-icon tile behind the sprout.
    var tile = false
    var color: Color = Theme.accentInk
    /// 0...1, for drawing the sprout in stroke by stroke.
    var progress: CGFloat = 1

    var body: some View {
        ZStack {
            if tile {
                RoundedRectangle(cornerRadius: size * 18 / 64, style: .continuous)
                    .fill(LinearGradient(colors: [Color(hex: 0x356B50), Theme.brand], startPoint: .top, endPoint: .bottom))
            }
            SproutShape()
                .trim(from: 0, to: progress)
                .stroke(
                    tile ? Theme.brandLeaf : color,
                    style: StrokeStyle(lineWidth: size * 4.5 / 64, lineCap: .round, lineJoin: .round)
                )
                .padding(tile ? size * 0.08 : 0)
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

/// Logo and name together, as in the web app's header.
struct Wordmark: View {
    var size: CGFloat = 26
    var color: Color = Theme.ink
    var markColor: Color = Theme.accentInk

    var body: some View {
        HStack(spacing: size * 0.3) {
            BrandMark(size: size * 1.45, color: markColor)
            Text("nourish")
                .font(.system(size: size, weight: .semibold, design: .rounded))
                .tracking(-size * 0.04)
                .foregroundStyle(color)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Nourish")
    }
}

#Preview {
    VStack(spacing: 24) {
        BrandMark(size: 120, tile: true)
        Wordmark()
    }
}
