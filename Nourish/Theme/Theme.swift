import SwiftUI
import UIKit

/// Nourish's palette, carried over from the web app: warm paper, clean
/// surfaces and a grounded sage accent, with a matching dark mode.
enum Theme {
    static let paper = Color(light: 0xF7F8F2, dark: 0x101B16)
    static let surface = Color(light: 0xFFFFFC, dark: 0x192820)
    static let surface2 = Color(light: 0xEBF0E5, dark: 0x223329)
    static let surface3 = Color(light: 0xDBE5D4, dark: 0x304336)

    static let ink = Color(light: 0x23392D, dark: 0xEDF3E8)
    static let ink2 = Color(light: 0x4E6053, dark: 0xBCCCBB)
    static let ink3 = Color(light: 0x657469, dark: 0x9CB19D)
    static let line = Color(light: 0xDCE3D7, dark: 0x35493A)

    static let accent = Color(light: 0x2D5F46, dark: 0xB1CF9D)
    static let onAccent = Color(light: 0xFFFFFF, dark: 0x142C1C)
    static let accentInk = Color(light: 0x28573E, dark: 0xBBDBA6)
    static let accentSoft = Color(light: 0xE4EEDC, dark: 0x283D2A)

    /// The logo tile and its leaf, identical in both appearances.
    static let brand = Color(hex: 0x2D5F46)
    static let brandDeep = Color(hex: 0x1D4232)
    static let brandLeaf = Color(hex: 0xE4EEDC)

    static let low = Color(light: 0x198046, dark: 0x75CF8F)
    static let moderate = Color(light: 0x936100, dark: 0xEBC460)
    static let high = Color(light: 0xB93515, dark: 0xFF8B71)

    static let shadow = Color(light: 0x7087731F, dark: 0x00000059, alpha: true)
}

extension Color {
    init(hex: UInt32) {
        self.init(uiColor: UIColor(hex: hex))
    }

    /// A colour that follows the system appearance. With `alpha`, the hex
    /// values are RRGGBBAA.
    init(light: UInt32, dark: UInt32, alpha: Bool = false) {
        self.init(uiColor: UIColor { traits in
            let hex = traits.userInterfaceStyle == .dark ? dark : light
            return alpha ? UIColor(rgba: hex) : UIColor(hex: hex)
        })
    }
}

extension UIColor {
    convenience init(hex: UInt32) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }

    convenience init(rgba: UInt32) {
        self.init(
            red: CGFloat((rgba >> 24) & 0xFF) / 255,
            green: CGFloat((rgba >> 16) & 0xFF) / 255,
            blue: CGFloat((rgba >> 8) & 0xFF) / 255,
            alpha: CGFloat(rgba & 0xFF) / 255
        )
    }
}

// MARK: - Type

extension Font {
    /// Headlines use SF Pro Rounded, the closest system match to the web
    /// app's soft display face.
    static func display(_ size: CGFloat, weight: Font.Weight = .bold) -> Font {
        .system(size: size, weight: weight, design: .rounded)
    }

    /// Barcodes, grams and scores: monospaced so columns never jitter.
    static func data(_ size: CGFloat = 13, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .monospaced)
    }
}

// MARK: - Surfaces

struct CardModifier: ViewModifier {
    var padding: CGFloat = 20
    var fill: Color = Theme.surface

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(fill, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
            .shadow(color: Theme.shadow, radius: 16, x: 0, y: 6)
    }
}

extension View {
    func card(padding: CGFloat = 20, fill: Color = Theme.surface) -> some View {
        modifier(CardModifier(padding: padding, fill: fill))
    }

    /// Small uppercase section label.
    func eyebrow() -> some View {
        font(.system(size: 12, weight: .semibold))
            .textCase(.uppercase)
            .tracking(0.8)
            .foregroundStyle(Theme.ink3)
    }
}

// MARK: - Buttons

struct PrimaryButtonStyle: ButtonStyle {
    var fill: Color = Theme.accent
    var foreground: Color = Theme.onAccent
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(foreground)
            .frame(maxWidth: .infinity, minHeight: 54)
            .background(fill, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .opacity(isEnabled ? 1 : 0.5)
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(Theme.ink)
            .frame(maxWidth: .infinity, minHeight: 54)
            .background(Theme.surface2, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

/// A gentle press for tappable cards and tiles.
struct PressableStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .opacity(configuration.isPressed ? 0.85 : 1)
            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == PrimaryButtonStyle {
    static var primary: PrimaryButtonStyle { PrimaryButtonStyle() }
}

extension ButtonStyle where Self == SecondaryButtonStyle {
    static var secondary: SecondaryButtonStyle { SecondaryButtonStyle() }
}

extension ButtonStyle where Self == PressableStyle {
    static var pressable: PressableStyle { PressableStyle() }
}
