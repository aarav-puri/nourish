'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, Globe, Sparkles, Check, ExternalLink } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Particles from '@/components/Particles'
import AuthModal from '@/components/auth/AuthModal'
import Button from '@/components/ui/Button'

const features = [
  'Surfaces product information instantly',
  'Suggests AI-powered healthier alternatives',
  'Adapts to mood and diet restrictions',
  'Checks dietary compatibility',
  'Highlights environmental impact',
  'Delivers AI-driven insights',
]

export default function AboutPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-dark">
      <Particles />
      <Navbar onAuthClick={() => setAuthModalOpen(true)} />

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-20">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>

        {/* Creator Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="w-36 h-36 rounded-full mx-auto mb-6 border-4 border-white/20 overflow-hidden animate-float">
            <Image
              src="/ap.jpeg"
              alt="Aarav Puri"
              width={144}
              height={144}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">Aarav Puri</h1>
          <a
            href="https://aaravpuri.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <Globe className="w-5 h-5" />
            aaravpuri.org
          </a>
        </motion.div>

        {/* Story Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-8"
        >
          <h2 className="flex items-center gap-3 text-2xl font-bold gradient-text mb-6">
            <Sparkles className="w-7 h-7" />
            The Origin Story
          </h2>
          <div className="space-y-4 text-zinc-300 leading-relaxed">
            <p>
              BarcodeSense was born from a simple, everyday problem: my dad is vegetarian, and I kept 
              noticing how often packaged foods quietly include ingredients that don't actually fit 
              vegetarian diets. Hidden animal-derived ingredients, confusing labels, and unclear 
              nutritional information made grocery shopping unnecessarily complicated.
            </p>
            <p>
              I wanted a simple way to scan products and immediately know what's inside—not just for 
              vegetarians, but for anyone trying to make informed choices about what they eat.
            </p>

            <p>
              From there, the concept expanded beyond just checking ingredients. I realized people need 
              help understanding what they're eating and making better choices with a simple scan. 
              BarcodeSense evolved into a comprehensive tool that:
            </p>

            <div className="grid sm:grid-cols-2 gap-3 my-6">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-zinc-800 hover:border-zinc-600 transition-colors"
                >
                  <Check className="w-5 h-5 text-white flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <p>
              The result is a clean, focused experience that helps you discover what's in your food 
              with a single scan—powered by AI, built from a personal problem, and designed to make 
              better eating feel effortless.
            </p>
          </div>
        </motion.div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card mb-12"
        >
          <h2 className="flex items-center gap-3 text-2xl font-bold gradient-text mb-6">
            <Check className="w-7 h-7" />
            The Mission
          </h2>
          <div className="space-y-4 text-zinc-300 leading-relaxed">
            <p>
              BarcodeSense is built on a simple philosophy: everyone deserves to know what they're 
              putting into their body, without needing to be a nutrition expert or spend hours 
              researching ingredients.
            </p>
            <p>
              As a developer passionate about building solutions that make everyday life easier, 
              I'm committed to continuously improving BarcodeSense based on real user needs and feedback.
            </p>
            <p>
              Every feature is designed with real people in mind, from the instant scanning capability 
              to the personalized AI recommendations. The goal is to empower you to make better food 
              choices effortlessly, whether you're managing dietary restrictions, trying to eat healthier, 
              or simply curious about what's in your groceries.
            </p>
            
            <blockquote className="border-l-4 border-white/30 pl-6 py-4 my-6 bg-white/5 rounded-r-xl">
              Built with: AI-powered analysis, real-time product data, and a focus on making nutrition 
              information accessible to everyone.
            </blockquote>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold gradient-text mb-6">Ready to discover what's in your food?</h2>
          <div className="flex items-center justify-center">
            <Link href="/app">
              <Button size="lg">
                <Sparkles className="w-5 h-5" />
                Try BarcodeSense Free
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
}
