import SwiftUI

/// For products the database does not know: copy the label in, and Nourish
/// analyses it the same way. Fields follow the order of a printed label so
/// the eye can run down the pack and the form together.
struct ManualEntryView: View {
    let barcode: String

    @Environment(History.self) private var history
    @Environment(KeyVault.self) private var keys
    @Environment(Router.self) private var router

    @State private var name = ""
    @State private var brand = ""
    @State private var ingredients = ""
    @State private var nutrients: [String: String] = [:]
    @State private var busy = false
    @State private var showErrors = false

    private struct Field {
        let key: String
        let label: String
        let unit: String
        var sub = false
    }

    private static let fields: [Field] = [
        Field(key: "energy-kcal_100g", label: "Energy", unit: "kcal"),
        Field(key: "fat_100g", label: "Fat", unit: "g"),
        Field(key: "saturated-fat_100g", label: "of which saturates", unit: "g", sub: true),
        Field(key: "carbohydrates_100g", label: "Carbohydrate", unit: "g"),
        Field(key: "sugars_100g", label: "of which sugars", unit: "g", sub: true),
        Field(key: "fiber_100g", label: "Fibre", unit: "g"),
        Field(key: "proteins_100g", label: "Protein", unit: "g"),
        Field(key: "salt_100g", label: "Salt", unit: "g"),
    ]

    private var valid: Bool { !name.trimmed.isEmpty && !ingredients.trimmed.isEmpty }

    var body: some View {
        Form {
            Section {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Enter it from the pack")
                        .font(.display(26))
                        .foregroundStyle(Theme.ink)
                    Text("Copy what is printed on the label. Nourish grades it, checks it against your profile and keeps it in your history.")
                        .font(.subheadline)
                        .foregroundStyle(Theme.ink2)
                    if !barcode.isEmpty {
                        Text(barcode).font(.data(13)).foregroundStyle(Theme.ink3).padding(.top, 2)
                    }
                }
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets(top: 8, leading: 4, bottom: 8, trailing: 4))
            }

            Section {
                TextField("Product name", text: $name)
                TextField("Brand (optional)", text: $brand)
            } footer: {
                if showErrors && name.trimmed.isEmpty { Text("Enter the product name.").foregroundStyle(Theme.high) }
            }

            Section {
                TextField("Whole grain oats (54%), honey, sunflower oil…", text: $ingredients, axis: .vertical)
                    .lineLimit(3...8)
            } header: {
                Text("Ingredients")
            } footer: {
                if showErrors && ingredients.trimmed.isEmpty {
                    Text("Copy the ingredients from the pack.").foregroundStyle(Theme.high)
                } else {
                    Text("Separated by commas, exactly as printed.")
                }
            }

            Section {
                ForEach(Self.fields, id: \.key) { field in
                    HStack {
                        Text(field.label)
                            .font(.system(size: 16, weight: field.sub ? .regular : .medium))
                            .foregroundStyle(field.sub ? Theme.ink2 : Theme.ink)
                            .padding(.leading, field.sub ? 14 : 0)
                        Spacer()
                        TextField("–", text: binding(for: field.key))
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .font(.data(16))
                            .frame(width: 80)
                        Text(field.unit)
                            .font(.data(12))
                            .foregroundStyle(Theme.ink3)
                            .frame(width: 34, alignment: .leading)
                    }
                }
            } header: {
                Text("Nutrition per 100g")
            } footer: {
                Text("Optional, but it makes the grade possible.")
            }
        }
        .scrollContentBackground(.hidden)
        .background(Theme.paper.ignoresSafeArea())
        .navigationTitle("New product")
        .navigationBarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) {
            Button {
                Task { await submit() }
            } label: {
                if busy {
                    HStack(spacing: 10) { ProgressView().tint(Theme.onAccent); Text("Analysing") }
                } else {
                    Text("Analyse this product")
                }
            }
            .buttonStyle(.primary)
            .disabled(busy)
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .background(.bar)
        }
    }

    private func binding(for key: String) -> Binding<String> {
        Binding(
            get: { nutrients[key] ?? "" },
            set: { text in nutrients[key] = String(text.filter { $0.isNumber || $0 == "." || $0 == "," }.prefix(7)) }
        )
    }

    private func submit() async {
        guard valid else {
            withAnimation { showErrors = true }
            return
        }
        busy = true
        defer { busy = false }

        var nutriments: [String: JSONValue] = [:]
        for field in Self.fields {
            if let value = Double((nutrients[field.key] ?? "").replacingOccurrences(of: ",", with: ".")), value >= 0 {
                nutriments[field.key] = .number(value)
            }
        }
        var raw: [String: JSONValue] = [
            "code": .string(barcode),
            "product_name": .string(name.trimmed),
            "ingredients_text": .string(ingredients.trimmed),
            "nutriments": .object(nutriments),
            "manual": .bool(true),
        ]
        if let brand = brand.trimmed.nonEmpty { raw["brands"] = .string(brand) }

        if keys.hasKey, let gemini = try? Gemini(key: keys.key) {
            let estimate = await ProductService.estimateGrades(.object(raw), with: gemini)
            ProductService.apply(estimate, to: &raw)
        }

        let food = Food(raw: .object(raw), barcodeHint: barcode)
        history.record(food)
        router.scanPath = [.food(food)]
    }
}
