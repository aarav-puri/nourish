import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="mx-auto max-w-3xl px-[var(--gutter)] pb-24 pt-10 sm:pt-16">
        <p className="t-eyebrow">Legal</p>
        <h1 className="t-title mt-2">Terms of Service</h1>
        <div className="prose-nourish mt-8">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Nourish, you accept and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>
              Nourish is a product scanning application that provides AI powered insights about food products, 
              including nutritional information, health scores and dietary compatibility.
            </p>
          </section>

          <section>
            <h2>3. User Accounts</h2>
            <p>
              You may create an account to save your scan history. You are responsible for maintaining the
              confidentiality of your account credentials and for all activities under your account.
            </p>
          </section>

          <section>
            <h2>4. Age Requirement</h2>
            <p>
              You must be at least 18 years old to use Nourish. By using our service, you represent and
              warrant that you meet this age requirement.
            </p>
          </section>

          <section>
            <h2>5. Disclaimer</h2>
            <p>
              The information provided by Nourish is for informational purposes only and should not be 
              considered medical or nutritional advice. Product information is sourced from third party databases 
              and AI analysis, which may not always be accurate or complete.
            </p>
            <p>
              Always consult with healthcare professionals for dietary decisions, especially if you have 
              allergies, medical conditions, or specific dietary requirements.
            </p>
          </section>

          <section>
            <h2>6. Limitation of Liability</h2>
            <p>
              Nourish and its creators shall not be liable for any direct, indirect, incidental, special, 
              or consequential damages resulting from the use or inability to use our service, or from any 
              information obtained through our service.
            </p>
          </section>

          <section>
            <h2>7. Intellectual Property</h2>
            <p>
              All content, features, and functionality of Nourish are owned by us and are protected by 
              international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2>8. Modifications</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the service after
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <p className="!mt-12 text-sm text-ink-3">
            Last updated: October 3, 2026
          </p>
        </div>
        <p className="mt-10 text-sm text-ink-2">
          Questions? See the <Link href="/about" className="font-medium text-ink underline decoration-ink/30 underline-offset-4">about page</Link>.
        </p>
      </main>
      <Footer />
    </>
  )
}
