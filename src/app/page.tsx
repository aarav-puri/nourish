'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Sparkles, Activity, Leaf, Upload, Smile, CheckSquare, 
  ArrowRight, Check, X, Minus
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Particles from '@/components/Particles'
import AuthModal from '@/components/auth/AuthModal'
import Button from '@/components/ui/Button'
import { auth } from '@/lib/supabase'

const features = [
  { icon: Sparkles, title: 'AI-Powered Analysis', description: 'Get instant insights about any product with advanced AI that understands ingredients, nutrition, and more.' },
  { icon: Activity, title: 'Health Score', description: 'See how healthy a product really is with our comprehensive scoring system based on ingredients and nutrition.' },
  { icon: Leaf, title: 'Eco Impact', description: 'Understand the environmental footprint of your purchases and make more sustainable choices.' },
  { icon: Upload, title: 'Instant Scanning', description: 'Upload a photo or enter a barcode manually — get results in seconds from our global product database.' },
  { icon: Smile, title: 'Mood Recommendations', description: 'Get personalized product suggestions based on your current mood and preferences.' },
  { icon: CheckSquare, title: 'Diet Compatibility', description: 'Check if products match your dietary restrictions — vegan, gluten-free, keto, and more.' },
]

const stats = [
  { value: '55%', label: 'of daily calories Americans consume come from ultra-processed foods', source: 'Johns Hopkins University' },
  { value: '32', label: 'harmful health effects linked to ultra-processed foods', source: 'BMJ Study' },
  { value: '51%', label: "of people don't fully understand nutrition labels", source: 'Food Health Research' },
]

const comparison = [
  { feature: 'AI-Powered Analysis', barcodesense: true, manual: false, basic: false },
  { feature: 'Health Score Analysis', barcodesense: true, manual: false, basic: 'partial' },
  { feature: 'Eco Impact Tracking', barcodesense: true, manual: false, basic: false },
  { feature: 'Smart Alternatives', barcodesense: true, manual: false, basic: false },
  { feature: 'Mood-Based Recommendations', barcodesense: true, manual: false, basic: false },
  { feature: 'Diet Compatibility Check', barcodesense: true, manual: 'partial', basic: 'partial' },
  { feature: 'Instant Results', barcodesense: true, manual: false, basic: true },
]

const steps = [
  { number: '1', title: 'Scan or Upload', description: 'Take a photo of any barcode or enter the numbers manually.' },
  { number: '2', title: 'AI Analysis', description: 'Our AI instantly analyzes ingredients, nutrition, and environmental impact.' },
  { number: '3', title: 'Make Better Choices', description: 'Get personalized insights and discover healthier, more sustainable alternatives.' },
]

export default function HomePage() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    auth.getCurrentUser().then((currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })
    const { data: { subscription } } = auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
      setAuthLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-dark">
      <Particles />
      <Navbar onAuthClick={() => setAuthModalOpen(true)} />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-zinc-300 mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Product Intelligence
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Know what you're buying with{' '}
              <span className="gradient-text">AI insights</span>
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
              Scan any barcode and instantly discover ingredients, health scores, eco-impact, 
              and smarter alternatives — all powered by AI.
            </p>
            
            <Link href="/app">
              <Button size="lg" className="group min-w-[200px] transition-opacity duration-300">
                <span className={authLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
                  {user ? 'Go to App' : 'Start Scanning Free'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm text-zinc-500 uppercase tracking-wider mb-2">The Problem</p>
            <h2 className="text-3xl md:text-4xl font-bold gradient-text">Why informed choices matter</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="card text-center">
                <div className="text-5xl font-bold gradient-text mb-4">{stat.value}</div>
                <p className="text-zinc-400 mb-4">{stat.label}</p>
                <p className="text-xs text-zinc-600">Source: {stat.source}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm text-zinc-500 uppercase tracking-wider mb-2">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold gradient-text">Everything you need to shop smarter</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="card group">
                <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm text-zinc-500 uppercase tracking-wider mb-2">Why Choose Us</p>
            <h2 className="text-3xl md:text-4xl font-bold gradient-text">BarcodeSense vs Traditional Methods</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-4 px-4 text-zinc-400 font-medium">Feature</th>
                  <th className="py-4 px-4 text-center">
                    <span className="font-bold text-white">BarcodeSense</span>
                  </th>
                  <th className="py-4 px-4 text-center text-zinc-400">Manual Reading</th>
                  <th className="py-4 px-4 text-center text-zinc-400">Basic Apps</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    <td className="py-4 px-4 text-zinc-300">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      <Check className="w-5 h-5 text-green-400 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.manual === true ? <Check className="w-5 h-5 text-green-400 mx-auto" /> :
                       row.manual === 'partial' ? <Minus className="w-5 h-5 text-yellow-400 mx-auto" /> :
                       <X className="w-5 h-5 text-zinc-600 mx-auto" />}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.basic === true ? <Check className="w-5 h-5 text-green-400 mx-auto" /> :
                       row.basic === 'partial' ? <Minus className="w-5 h-5 text-yellow-400 mx-auto" /> :
                       <X className="w-5 h-5 text-zinc-600 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm text-zinc-500 uppercase tracking-wider mb-2">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold gradient-text">Three simple steps</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white to-zinc-400 flex items-center justify-center text-2xl font-bold text-dark mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-zinc-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy & Security Section */}
      <section className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm text-zinc-500 uppercase tracking-wider mb-2">Built for You</p>
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">Created by someone who cares</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto mb-6">
              BarcodeSense was built by a developer who wanted to make healthier choices but found 
              nutrition labels confusing. Now it's here to help you too.
            </p>
            <a 
              href="/about" 
              className="inline-flex items-center gap-2 text-white hover:text-zinc-300 transition-colors"
            >
              <span>Read the story</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Privacy & Security Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm text-zinc-500 uppercase tracking-wider mb-2">Privacy First</p>
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">Your data belongs to you</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              We're committed to protecting your privacy. Your information is secure, private, and never sold.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Encrypted Storage</h3>
              <p className="text-sm text-zinc-400">Your data is encrypted and stored securely with industry-standard protection.</p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Never Sold</h3>
              <p className="text-sm text-zinc-400">We will never sell your personal information or scan history. Ever.</p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Private by Default</h3>
              <p className="text-sm text-zinc-400">Your scans and insights are private. Only you can see your data.</p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Delete Anytime</h3>
              <p className="text-sm text-zinc-400">Request deletion and we'll permanently remove all your data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm text-zinc-500 uppercase tracking-wider mb-2">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold gradient-text">Simple, transparent pricing</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="card p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="text-4xl font-bold gradient-text mb-2">$0</div>
                <p className="text-zinc-400 text-sm">Forever free</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">Unlimited barcode scans</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">Product information & nutrition</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">Scan history</span>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">
                    <strong className="text-white">1 AI insight per day</strong>
                    <span className="block text-sm text-zinc-500 mt-1">
                      ~30 insights per month
                    </span>
                  </span>
                </li>
              </ul>
              
              <Link href="/app" className="block">
                <Button variant="secondary" className="w-full">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="card p-8 relative overflow-hidden border-2 border-white/20">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-gradient-to-r from-white to-zinc-400 text-dark text-xs font-bold rounded-full">
                  COMING SOON
                </span>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="text-4xl font-bold gradient-text mb-2">
                  $4.99
                  <span className="text-lg text-zinc-400">/mo</span>
                </div>
                <p className="text-zinc-400 text-sm">For power users</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">Everything in Free</span>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">
                    <strong className="text-white">10 AI insights per day</strong>
                    <span className="block text-sm text-zinc-500 mt-1">
                      300 insights per month
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">Export scan history</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">Priority support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm text-zinc-500 uppercase tracking-wider mb-2">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold gradient-text">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            <details className="card p-6 cursor-pointer group">
              <summary className="font-semibold text-lg text-white list-none flex items-center justify-between">
                How does BarcodeSense work?
                <span className="text-zinc-500">▼</span>
              </summary>
              <p className="mt-4 text-zinc-400 leading-relaxed">
                Simply scan or upload a photo of any product barcode, or enter the barcode number manually. 
                BarcodeSense instantly retrieves product information from global databases and uses AI to 
                analyze ingredients, nutrition, environmental impact, and provide personalized recommendations.
              </p>
            </details>

            <details className="card p-6 cursor-pointer group">
              <summary className="font-semibold text-lg text-white list-none flex items-center justify-between">
                What are AI insights?
                <span className="text-zinc-500">▼</span>
              </summary>
              <p className="mt-4 text-zinc-400 leading-relaxed">
                AI insights are advanced analyses powered by artificial intelligence that help you understand 
                products better. This includes health scores, healthier alternatives, diet compatibility checks 
                (vegan, keto, gluten-free, etc.), mood-based recommendations, and environmental impact assessments.
              </p>
            </details>

            <details className="card p-6 cursor-pointer group">
              <summary className="font-semibold text-lg text-white list-none flex items-center justify-between">
                How accurate is the product information?
                <span className="text-zinc-500">▼</span>
              </summary>
              <p className="mt-4 text-zinc-400 leading-relaxed">
                We source product data from comprehensive global databases with millions of products. While we 
                strive for accuracy, product information is provided for informational purposes only. Always 
                check the physical product label for the most up-to-date information, especially for allergies 
                or dietary restrictions.
              </p>
            </details>

            <details className="card p-6 cursor-pointer group">
              <summary className="font-semibold text-lg text-white list-none flex items-center justify-between">
                What if a product isn't in the database?
                <span className="text-zinc-500">▼</span>
              </summary>
              <p className="mt-4 text-zinc-400 leading-relaxed">
                While our database covers millions of products worldwide, some items—especially local or newly 
                released products—may not be available yet. If a product isn't found, you can still manually 
                enter product details, and our AI can analyze ingredients and nutrition information you provide. 
                We're constantly expanding our database coverage.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card p-10">
            <h2 className="text-3xl font-bold mb-4">Ready to shop smarter?</h2>
            <p className="text-zinc-400 mb-8">Start scanning products and get AI-powered insights instantly.</p>
            <Link href="/app">
              <Button size="lg" className="min-w-[220px] transition-opacity duration-300">
                <span className={authLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
                  {user ? 'Go to App' : 'Try BarcodeSense Free'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
}
