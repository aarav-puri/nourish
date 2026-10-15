import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="mx-auto max-w-3xl px-[var(--gutter)] pb-24 pt-10 sm:pt-16">
        <p className="t-eyebrow">Legal</p>
        <h1 className="t-title mt-2">Privacy Policy</h1>
        <div className="prose-nourish mt-8">
          <section>
            <h2>1. Information We Collect</h2>
            <p>When you use Nourish, we may collect:</p>
            <ul>
              <li>Account information (email address) when you sign up</li>
              <li>Product barcodes you scan</li>
              <li>Your scan history (if you're logged in)</li>
              <li>Your food profile: the diets and allergens you choose to save, stored with your account</li>
              <li>Usage data to improve our service</li>
            </ul>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide and improve our barcode scanning service</li>
              <li>Save your scan history for your convenience</li>
              <li>Generate AI powered product insights</li>
              <li>Communicate with you about your account</li>
            </ul>
          </section>

          <section>
            <h2>3. Data Storage</h2>
            <p>
              We take the security of your data seriously and implement industry-standard security measures:
            </p>
            <ul>
              <li>
                <span>Encryption in Transit (TLS):</span>{' '}
                All data transmitted between your device and our servers is encrypted using Transport Layer Security (TLS)
              </li>
              <li>
                <span>Encryption at Rest (AES-256):</span>{' '}
                All data stored in our database is encrypted using AES-256 encryption
              </li>
              <li>
                <span>Secure Infrastructure:</span>{' '}
                We use Supabase, an enterprise-grade database platform with built-in security features
              </li>
              <li>
                <span>Row Level Security:</span>{' '}
                Your data is isolated and protected with database-level access controls
              </li>
              <li>
                <span>Regular Backups:</span>{' '}
                Your information is regularly backed up to prevent data loss
              </li>
            </ul>
            <p>
              We use standard security measures, but no method of transmission over the Internet or electronic storage is 100% secure.
              We continuously monitor and update our security practices.
            </p>
          </section>

          <section>
            <h2>4. Third Party Services</h2>
            <p>
              We use trusted third party services to provide and improve our application, including 
              product databases, AI analysis providers, authentication services, and cloud infrastructure. 
              These services are carefully selected for their security and reliability standards.
            </p>
          </section>

          <section>
            <h2>5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Delete your account and associated data</li>
              <li>Export your scan history</li>
              <li>Opt out of non essential data collection</li>
            </ul>
          </section>

          <section>
            <h2>6. Age Requirement</h2>
            <p>
              Nourish is intended for users who are 18 years of age or older. By using our service, you
              represent and warrant that you are at least 18 years old. We do not knowingly collect
              personal information from anyone under 18.
            </p>
          </section>

          <p className="!mt-12 text-sm text-ink-3">
            Last updated: October 14, 2026
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
