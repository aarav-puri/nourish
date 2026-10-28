<div align="center">

<a href="https://nourishlabs.vercel.app">
  <img src="public/brand/mark.svg" alt="Nourish" height="64">
</a>

<h1>Nourish</h1>

### The fine print, made clear.

Scan a barcode and see exactly what is inside, clearly explained: a health score out of 100, how processed it is, and whether it fits your diet and allergies.

[**Open Nourish**](https://nourishlabs.vercel.app) · [Privacy Policy](https://nourishlabs.vercel.app/privacy) · [How it works](#how-it-works) · [Run it locally](#run-it-locally)

![Next.js 15](https://img.shields.io/badge/Next.js-15-1f2a24?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-2d5f46?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-2d5f46?logo=supabase&logoColor=white)
![Gemini](https://img.shields.io/badge/AI-Gemini-2d5f46?logo=googlegemini&logoColor=white)
![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-1f2a24?logo=vercel&logoColor=white)

</div>

---

## Features

- **A score out of 100**, built on the Nutri-Score, with sugar, fat and salt marked low, medium or high
- **How processed it is**: the NOVA level from 1 to 4, and the plain name behind every E number
- **Checked against you**: save your diets and allergens once, and every scan flags what does not fit
- **Ask Nourish AI**, a chat assistant that answers from your own scans ("Which of my snacks has the least sugar?")
- **Four ways to scan**: live camera, a photo of the barcode, drag and drop or paste an image, or type the number
- **Scan history** saved to your account

## How it works

1. **Create an account** with email or Google.
2. **Set up your profile.** A short onboarding asks for your name, the diets you follow, and the allergens and ingredients you avoid.
3. **Scan something.** Nourish looks the barcode up in [Open Food Facts](https://world.openfoodfacts.org) (with Go-UPC as a fallback) and builds the report.
4. **Add a Gemini key for AI insights.** Nourish AI uses your own Google Gemini API key, which you paste in Settings. Scores and ingredient checks work without one.

Supported barcodes: EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39 and QR codes.

> Nourish is a guide, not medical advice. Always read the label yourself if you have a serious allergy.

## Built with

| Layer | Technology |
| --- | --- |
| Web app | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| Accounts and data | Supabase: email and Google sign-in, Postgres for profiles and scan history, Storage for avatars |
| Product data | Open Food Facts, with Go-UPC as an optional fallback |
| AI | Google Gemini (Flash and Flash Lite) with the user's own key |
| Scanning | Quagga barcode detection on the camera stream and on images |
| Motion | Motion for React, Sonner for toasts, Lucide icons |
| Hosting | Vercel |

## Repository layout

```
src/app            Pages: landing, sign-in, setup, scanner, history, settings, product reports
src/app/api        Route handlers: product lookup, scoring, AI insights, chat, account deletion
src/components     UI: scanner, product report, Nourish AI chat, layout, brand
src/lib            Product API client, Gemini scoring and insight helpers, Supabase clients
supabase/          SQL for the avatars bucket and the auth email templates
public/            Static assets: logo mark, Apple touch icons
scripts/           Asset generators (touch icons, mascot layers)
```

## Run it locally

Requires Node 20+ and a Supabase project.

```bash
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...          # server only: used for account deletion
NEXT_PUBLIC_APP_URL=http://localhost:3000
GO_UPC_API_KEY=...                     # optional: fallback product lookup
```

Run `supabase/sql/avatars-bucket.sql` in the Supabase SQL editor, enable the Google provider under Authentication if you want Google sign-in, then start the app:

```bash
npm run dev                            # http://localhost:3000
```

## Deploying

Pushes to `main` deploy to production on Vercel. Set the same variables in the Vercel project, and add your production URL to the Supabase redirect allow list so sign-in can return to it.
