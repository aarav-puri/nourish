import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Footer from '@/components/layout/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold gradient-text mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert prose-zinc max-w-none space-y-6 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
            <p>When you use BarcodeSense, we may collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (email address) when you sign up</li>
              <li>Product barcodes you scan</li>
              <li>Your scan history (if you're logged in)</li>
              <li>Usage data to improve our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve our barcode scanning service</li>
              <li>Save your scan history for your convenience</li>
              <li>Generate AI-powered product insights</li>
              <li>Communicate with you about your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Data Storage</h2>
            <p>
              Your data is stored securely using Supabase, a trusted database provider. 
              We implement industry-standard security measures to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Open Food Facts API for product information</li>
              <li>OpenRouter AI for generating product insights</li>
              <li>Supabase for authentication and data storage</li>
              <li>Google OAuth for sign-in</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Delete your account and associated data</li>
              <li>Export your scan history</li>
              <li>Opt out of non-essential data collection</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
