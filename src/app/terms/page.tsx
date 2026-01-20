import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Footer from '@/components/layout/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-dark">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold gradient-text mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert prose-zinc max-w-none space-y-6 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using BarcodeSense, you accept and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Description of Service</h2>
            <p>
              BarcodeSense is a product scanning application that provides AI-powered insights about food products, 
              including nutritional information, health scores, dietary compatibility, and environmental impact.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. User Accounts</h2>
            <p>
              You may create an account to save your scan history. You are responsible for maintaining the 
              confidentiality of your account credentials and for all activities under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Disclaimer</h2>
            <p>
              The information provided by BarcodeSense is for informational purposes only and should not be 
              considered medical or nutritional advice. Product information is sourced from third-party databases 
              and AI analysis, which may not always be accurate or complete.
            </p>
            <p className="mt-4">
              Always consult with healthcare professionals for dietary decisions, especially if you have 
              allergies, medical conditions, or specific dietary requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Limitation of Liability</h2>
            <p>
              BarcodeSense and its creators shall not be liable for any direct, indirect, incidental, special, 
              or consequential damages resulting from the use or inability to use our service, or from any 
              information obtained through our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">6. Intellectual Property</h2>
            <p>
              All content, features, and functionality of BarcodeSense are owned by us and are protected by 
              international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">7. Modifications</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the service after 
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">8. Contact</h2>
            <p>
              For questions about these Terms of Service, please contact us at{' '}
              <a 
                href="mailto:barcodesenseofficial@gmail.com"
                className="text-white hover:underline font-medium"
              >
                barcodesenseofficial@gmail.com
              </a>
            </p>
          </section>

          <p className="text-sm text-zinc-500 mt-12">
            Last updated: January 16, 2026
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
