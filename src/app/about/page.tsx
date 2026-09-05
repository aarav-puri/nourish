'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, Globe } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import { useAuth } from '@/lib/auth-context'

export default function AboutPage() {
  const { user, loading: authLoading } = useAuth()

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />

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
          className="card mb-12"
        >
          <h2 className="text-2xl font-bold gradient-text mb-6">The Origin Story</h2>
          <div className="space-y-4 text-zinc-300 leading-relaxed">
            <p>
              BarcodeSense was born from a simple, everyday problem: my dad is vegetarian, and I kept 
              noticing how often packaged foods quietly include ingredients that don't actually fit 
              vegetarian diets. Hidden animal derived ingredients, confusing labels, and unclear 
              nutritional information made grocery shopping unnecessarily complicated.
            </p>
            <p>
              I wanted a simple way to scan products and immediately know what's inside, not just for 
              vegetarians but for anyone trying to make informed choices about what they eat.
            </p>

            <p>
              From there, the concept expanded beyond just checking ingredients. I realized people need 
              help understanding what they're eating and making better choices with a simple scan.
            </p>

            <p>
              The result is a clean, focused experience that helps you discover what's in your food 
              with a single scan, powered by AI, built from a personal problem, and designed to make 
              better eating feel effortless.
            </p>
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
              <Button size="lg" className="min-w-[220px] transition-opacity duration-300">
                <span className={authLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
                  {user ? 'Go to App' : 'Try BarcodeSense Free'}
                </span>
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}
