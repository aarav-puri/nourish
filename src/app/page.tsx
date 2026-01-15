'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  Sparkles, Activity, Leaf, Upload, Smile, CheckSquare, 
  ArrowRight, Check, X, Minus
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Particles from '@/components/Particles'
import AuthModal from '@/components/auth/AuthModal'
import Button from '@/components/ui/Button'

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

  return (
    <div className="min-h-screen bg-dark">
      <Particles />
      <Navbar onAuthClick={() => setAuthModalOpen(true)} />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-zinc-300 mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Product Intelligence
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Know what you're buying with{' '}
              <span className="animated-gradient-text">AI insights</span>
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
              Scan any barcode and instantly discover ingredients, health scores, eco-impact, 
              and smarter alternatives — all powered by AI.
            </p>
            
            <Link href="/app">
              <Button size="lg" className="group">
                Start Scanning Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
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
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card text-center"
              >
                <div className="text-5xl font-bold gradient-text mb-4">{stat.value}</div>
                <p className="text-zinc-400 mb-4">{stat.label}</p>
                <p className="text-xs text-zinc-600">Source: {stat.source}</p>
              </motion.div>
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
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card-interactive card-shimmer group"
              >
                <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-white group-hover:text-dark transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </motion.div>
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
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white to-zinc-400 flex items-center justify-center text-2xl font-bold text-dark mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-zinc-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="card p-10"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to shop smarter?</h2>
            <p className="text-zinc-400 mb-8">Start scanning products and get AI-powered insights instantly.</p>
            <Link href="/app">
              <Button size="lg" className="group">
                Try BarcodeSense Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
}
