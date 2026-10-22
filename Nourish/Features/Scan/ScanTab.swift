import AVFoundation
import PhotosUI
import SwiftUI
import UIKit

struct ScanTab: View {
    @Environment(Router.self) private var router

    var body: some View {
        @Bindable var router = router
        NavigationStack(path: $router.scanPath) {
            ScanHome()
                .navigationDestination(for: ScanRoute.self) { route in
                    switch route {
                    case .lookup(let code):
                        LookupView(code: code)
                    case .manual(let code):
                        ManualEntryView(barcode: code)
                    case .food(let food):
                        ProductView(food: food)
                    }
                }
        }
    }
}

/// The camera, full bleed, with everything else a thumb's reach away.
struct ScanHome: View {
    @Environment(Router.self) private var router
    @Environment(History.self) private var history
    @Environment(Account.self) private var account
    @Environment(\.scenePhase) private var scenePhase

    @State private var camera = AVCaptureDevice.authorizationStatus(for: .video)
    @State private var torch = false
    @State private var typing = false
    @State private var photoItem: PhotosPickerItem?
    @State private var readingPhoto = false
    @State private var detected: String?
    @State private var toast: Toast?

    private var scanning: Bool {
        router.tab == .scan && router.scanPath.isEmpty && scenePhase == .active && !typing && detected == nil
    }

    private var cameraReady: Bool {
        camera == .authorized && CameraScanner.isAvailable
    }

    var body: some View {
        ZStack {
            if cameraReady {
                CameraScanner(isActive: scanning) { code in found(code) }
                    .ignoresSafeArea()
                ViewfinderOverlay(locked: detected != nil)
                    .ignoresSafeArea()
                    .allowsHitTesting(false)
            } else {
                NoCameraBackground(status: camera, request: requestCamera)
            }

            VStack(spacing: 0) {
                topBar
                Spacer()
                bottomPanel
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .toolbarBackground(.visible, for: .tabBar)
        .toolbarColorScheme(cameraReady ? .dark : nil, for: .tabBar)
        .toast($toast)
        .sheet(isPresented: $typing) {
            BarcodeEntrySheet { code in
                typing = false
                open(code)
            }
            .presentationDetents([.height(340)])
            .presentationCornerRadius(28)
        }
        .onChange(of: photoItem) { _, item in
            guard let item else { return }
            Task { await read(item) }
        }
        .onChange(of: scanning) { _, active in
            if !active && torch { torch = false; Torch.set(false) }
        }
        .onAppear {
            camera = AVCaptureDevice.authorizationStatus(for: .video)
            if camera == .notDetermined { requestCamera() }
        }
        .sensoryFeedback(.success, trigger: detected) { _, new in new != nil }
    }

    // MARK: Pieces

    private var topBar: some View {
        HStack {
            Wordmark(size: 22, color: cameraReady ? .white : Theme.ink, markColor: cameraReady ? Theme.brandLeaf : Theme.accentInk)
            Spacer()
            if cameraReady && Torch.isAvailable {
                Button {
                    torch.toggle()
                    Torch.set(torch)
                } label: {
                    Image(systemName: torch ? "flashlight.on.fill" : "flashlight.off.fill")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(torch ? Theme.brandDeep : .white)
                        .frame(width: 44, height: 44)
                        .background(torch ? AnyShapeStyle(Theme.brandLeaf) : AnyShapeStyle(.ultraThinMaterial), in: Circle())
                }
                .accessibilityLabel(torch ? "Turn torch off" : "Turn torch on")
                .sensoryFeedback(.impact(weight: .light), trigger: torch)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
    }

    private var bottomPanel: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 10) {
                if readingPhoto {
                    ProgressView().tint(Theme.ink)
                    Text("Reading the photo…")
                } else if let detected {
                    Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.low)
                    Text(detected).font(.data(16, weight: .semibold))
                } else {
                    Image(systemName: "barcode")
                    Text(cameraReady ? "Point at a barcode" : "Find a product")
                }
            }
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(Theme.ink)
            .contentTransition(.opacity)
            .animation(.easeInOut, value: detected)

            HStack(spacing: 10) {
                actionButton("Type a code", symbol: "keyboard") { typing = true }
                PhotosPicker(selection: $photoItem, matching: .images) {
                    actionLabel("From a photo", symbol: "photo")
                }
                .buttonStyle(.pressable)
            }

            if !history.entries.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Recent").eyebrow()
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(history.entries.prefix(10)) { entry in
                                Button {
                                    router.scanPath.append(.food(entry.food))
                                } label: {
                                    RecentChip(entry: entry)
                                }
                                .buttonStyle(.pressable)
                            }
                        }
                    }
                    .scrollClipDisabled()
                }
            }
        }
        .padding(20)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 30, style: .continuous))
        .padding(.horizontal, 12)
        .padding(.bottom, 8)
    }

    private func actionButton(_ title: String, symbol: String, action: @escaping () -> Void) -> some View {
        Button(action: action) { actionLabel(title, symbol: symbol) }
            .buttonStyle(.pressable)
    }

    private func actionLabel(_ title: String, symbol: String) -> some View {
        Label(title, systemImage: symbol)
            .font(.system(size: 15, weight: .semibold))
            .foregroundStyle(Theme.ink)
            .frame(maxWidth: .infinity, minHeight: 48)
            .background(Theme.surface.opacity(0.9), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    // MARK: Actions

    private func found(_ code: String) {
        guard detected == nil else { return }
        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) { detected = code }
        Task {
            try? await Task.sleep(for: .milliseconds(450))
            open(code)
            try? await Task.sleep(for: .milliseconds(400))
            detected = nil
        }
    }

    private func open(_ code: String) {
        guard let clean = ProductService.normalize(code) else {
            toast = Toast(message: "A barcode is 6 to 14 digits. Check the number under the bars.", style: .error)
            return
        }
        if let food = history.cache[clean] {
            router.scanPath.append(.food(food))
        } else {
            router.scanPath.append(.lookup(clean))
        }
    }

    private func read(_ item: PhotosPickerItem) async {
        readingPhoto = true
        defer {
            readingPhoto = false
            photoItem = nil
        }
        guard let data = try? await item.loadTransferable(type: Data.self), let image = UIImage(data: data) else {
            toast = Toast(message: "Could not open that photo.", style: .error)
            return
        }
        if let code = await PhotoBarcodeReader.read(image) {
            found(code)
        } else {
            toast = Toast(message: "No barcode found in that photo. Try a closer, sharper shot.", style: .error)
        }
    }

    private func requestCamera() {
        if camera == .denied || camera == .restricted {
            if let url = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(url) }
            return
        }
        AVCaptureDevice.requestAccess(for: .video) { _ in
            Task { @MainActor in camera = AVCaptureDevice.authorizationStatus(for: .video) }
        }
    }
}

/// A dimmed frame with a clear window and animated corners.
struct ViewfinderOverlay: View {
    var locked: Bool
    @State private var sweep = false

    var body: some View {
        GeometryReader { proxy in
            let width = min(proxy.size.width - 64, 340)
            let height = width * 0.62
            let rect = CGRect(x: (proxy.size.width - width) / 2, y: proxy.size.height * 0.36 - height / 2, width: width, height: height)

            ZStack {
                Rectangle()
                    .fill(.black.opacity(0.38))
                    .overlay {
                        RoundedRectangle(cornerRadius: 26, style: .continuous)
                            .frame(width: rect.width, height: rect.height)
                            .position(x: rect.midX, y: rect.midY)
                            .blendMode(.destinationOut)
                    }
                    .compositingGroup()

                ViewfinderCorners()
                    .stroke(locked ? Theme.low : .white, style: StrokeStyle(lineWidth: 5, lineCap: .round, lineJoin: .round))
                    .frame(width: rect.width, height: rect.height)
                    .scaleEffect(locked ? 0.94 : 1)
                    .position(x: rect.midX, y: rect.midY)
                    .shadow(color: .black.opacity(0.3), radius: 6)

                if !locked {
                    Capsule()
                        .fill(LinearGradient(colors: [.clear, Theme.brandLeaf.opacity(0.9), .clear], startPoint: .leading, endPoint: .trailing))
                        .frame(width: rect.width - 40, height: 2.5)
                        .shadow(color: Theme.brandLeaf, radius: 8)
                        .position(x: rect.midX, y: rect.midY + (sweep ? rect.height * 0.36 : -rect.height * 0.36))
                }
            }
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: locked)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) { sweep = true }
        }
    }
}

struct ViewfinderCorners: Shape {
    func path(in rect: CGRect) -> Path {
        let length: CGFloat = 34
        let radius: CGFloat = 22
        var path = Path()
        // Top left, top right, bottom right, bottom left: each a rounded bracket.
        path.move(to: CGPoint(x: rect.minX, y: rect.minY + length))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + radius))
        path.addQuadCurve(to: CGPoint(x: rect.minX + radius, y: rect.minY), control: CGPoint(x: rect.minX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.minX + length, y: rect.minY))

        path.move(to: CGPoint(x: rect.maxX - length, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX - radius, y: rect.minY))
        path.addQuadCurve(to: CGPoint(x: rect.maxX, y: rect.minY + radius), control: CGPoint(x: rect.maxX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY + length))

        path.move(to: CGPoint(x: rect.maxX, y: rect.maxY - length))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - radius))
        path.addQuadCurve(to: CGPoint(x: rect.maxX - radius, y: rect.maxY), control: CGPoint(x: rect.maxX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.maxX - length, y: rect.maxY))

        path.move(to: CGPoint(x: rect.minX + length, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX + radius, y: rect.maxY))
        path.addQuadCurve(to: CGPoint(x: rect.minX, y: rect.maxY - radius), control: CGPoint(x: rect.minX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY - length))
        return path
    }
}

/// Shown when there is no live camera: asks for access, or explains why not.
struct NoCameraBackground: View {
    let status: AVAuthorizationStatus
    let request: () -> Void

    var body: some View {
        ZStack {
            LinearGradient(colors: [Theme.accentSoft, Theme.paper], startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
            VStack(spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 28, style: .continuous)
                        .fill(Theme.surface)
                        .frame(width: 112, height: 112)
                        .shadow(color: Theme.shadow, radius: 20, y: 8)
                    Image(systemName: "barcode.viewfinder")
                        .font(.system(size: 50, weight: .medium))
                        .foregroundStyle(Theme.accentInk)
                }
                Text(title)
                    .font(.display(24))
                    .foregroundStyle(Theme.ink)
                Text(detail)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.ink2)
                    .padding(.horizontal, 32)
                if status != .authorized {
                    Button(status == .notDetermined ? "Allow camera" : "Open Settings", action: request)
                        .buttonStyle(.primary)
                        .frame(width: 220)
                        .padding(.top, 4)
                }
            }
            .offset(y: -90)
        }
    }

    private var title: String {
        switch status {
        case .authorized: "Camera unavailable"
        case .denied, .restricted: "Camera is off"
        default: "Scan with your camera"
        }
    }

    private var detail: String {
        switch status {
        case .authorized: "This device cannot scan live. Type the code or pick a photo of the barcode instead."
        case .denied, .restricted: "Allow camera access in Settings to scan barcodes live. You can still type a code or use a photo."
        default: "Nourish reads barcodes on the pack. Nothing is recorded or uploaded."
        }
    }
}

struct RecentChip: View {
    let entry: ScanEntry

    var body: some View {
        HStack(spacing: 10) {
            ProductThumb(url: entry.food.image, size: 40)
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.food.name)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.ink)
                    .lineLimit(1)
                Text(relativeTime(entry.scannedAt))
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.ink3)
            }
            .frame(maxWidth: 130, alignment: .leading)
            GradeBadge(grade: entry.food.grade, size: 26)
        }
        .padding(8)
        .padding(.trailing, 4)
        .background(Theme.surface.opacity(0.9), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

/// Type the digits under the bars.
struct BarcodeEntrySheet: View {
    let onSubmit: (String) -> Void
    @State private var code = ""
    @FocusState private var focused: Bool

    private var digits: String { code.filter(\.isNumber) }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Type the barcode")
                .font(.display(24))
                .foregroundStyle(Theme.ink)
            Text("The 8 to 13 digits printed under the bars.")
                .foregroundStyle(Theme.ink2)
            TextField("5000159407236", text: $code)
                .keyboardType(.numberPad)
                .font(.data(26, weight: .semibold))
                .tracking(2)
                .focused($focused)
                .padding(.horizontal, 18)
                .frame(height: 64)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(Theme.line, lineWidth: 1))
                .onChange(of: code) { _, value in
                    let filtered = String(value.filter(\.isNumber).prefix(14))
                    if filtered != value { code = filtered }
                }
            Button("Look it up") { onSubmit(digits) }
                .buttonStyle(.primary)
                .disabled(digits.count < 6)
        }
        .padding(24)
        .frame(maxHeight: .infinity, alignment: .top)
        .background(Theme.paper)
        .onAppear { focused = true }
    }
}
