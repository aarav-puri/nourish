# Nourish

Know what is in your food. Nourish is a native iPhone app: point the camera at
any barcode to see the product's grade, sugar, additives and allergens, checked
against your own diet, and ask Olive, the in-app food guide, about everything
you have scanned.

Built with SwiftUI for iOS 17 and later. It has no third-party dependencies.

## Features

- **Live scanning.** VisionKit's DataScanner reads EAN-13, EAN-8, UPC-E,
  Code 128, Code 39 and ITF-14. It has a torch toggle and haptic confirmation.
- **Photo and typed codes.** You can read a barcode from a photo in your
  library, or type the digits.
- **Product report.** It shows the Nutri-Score scale, key strengths and
  concerns, and a nutrition label with FSA traffic-light levels. It also covers
  NOVA processing, additives, allergens, the Eco-Score and the ingredients.
- **For you.** Each scan is checked against your diets (vegan, halal, keto
  and more) and the allergens you avoid.
- **Go further.** Gemini suggests healthier swaps, runs diet checks, writes
  recipe ideas and estimates the product's footprint. Answers are saved per
  product.
- **Olive.** A chat that answers questions about your own scan history.
- **History.** Your scans are grouped by day, with search, swipe to delete
  and a grade breakdown.
- **Not in the database?** You can type the label in by hand. Nourish grades
  it the same way.
- **Account.** Sign in with email or Google. Your food profile syncs, and you
  can change your photo, reset your password or delete your account.
- Full dark mode and VoiceOver labels.

## Project layout

```
Nourish.xcodeproj         Xcode 16 project (folders are synced, so new files are picked up automatically)
Config/                   Info.plist and build settings; Supabase credentials go in Secrets.xcconfig
Nourish/
  App/                    App entry, root flow, tab bar and router
  Theme/                  Colours (light and dark), type and button styles
  Brand/                  The sprout logo and Olive, drawn in SwiftUI
  Models/                 Food and profile logic: normalisation, levels, allergen and diet checks
  Services/               Supabase auth and REST, Open Food Facts, Gemini, Keychain
  Components/             Grade badges, chips, flow layout, toasts
  Features/               Onboarding, Scan, Product, History, Olive and Settings screens
  Assets.xcassets         App icon, accent colour and launch screen
supabase/                 SQL to run once in the Supabase SQL editor
```

## Getting started

You need a Mac with Xcode 16 or later. A physical iPhone is needed for live
scanning, because the simulator has no camera. Typing a code and photo
scanning do work in the simulator.

1. **Add your Supabase credentials.**
   ```sh
   cp Config/Secrets.example.xcconfig Config/Secrets.xcconfig
   ```
   Fill in `SUPABASE_HOST`, which is the host only, for example
   `abcd1234.supabase.co`. Also fill in `SUPABASE_ANON_KEY`. Both are in
   Supabase Dashboard › Project Settings › API.
2. **Set up Supabase.** Do this once:
   - Run `supabase/sql/avatars-bucket.sql` and
     `supabase/sql/delete-account.sql` in the SQL editor.
   - Under Authentication › URL Configuration › Redirect URLs, add
     `nourish://auth-callback` and `nourish://reset-password`.
   - Optional: enable the Google provider under Authentication › Providers
     for "Continue with Google".
   - The app uses the existing `scanned_products` and `ai_insights` tables,
     with row-level security keyed on `user_id`.
3. **Run it.** Open `Nourish.xcodeproj` and pick your team under Signing &
   Capabilities. Then run on your iPhone.

On first launch you sign in and choose your diets and allergens. Then you can
paste a free Gemini key from
[Google AI Studio](https://aistudio.google.com/apikey). The key stays in the
iPhone's Keychain and is only ever sent to Google.

## Data sources

- Product data comes from [Open Food Facts](https://world.openfoodfacts.org),
  a free and open food database.
- Nutrient levels use the UK Food Standards Agency front-of-pack thresholds.
- When a product has no published grade, Gemini estimates one. The app always
  labels these grades as estimated.
