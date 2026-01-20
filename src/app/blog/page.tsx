'use client'

import Link from 'next/link'
import { FileText, Calendar, Clock, ArrowRight } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Particles from '@/components/Particles'

const blogPosts = [
  {
    slug: 'nutrition-literacy-upf-crisis',
    title: 'The Nutrition Literacy Crisis and Ultra-Processed Foods',
    excerpt: 'Understanding the growing health crisis and why tools like BarcodeSense matter. Explore the intersection of ultra-processed foods and low nutrition literacy.',
    date: 'January 20, 2026',
    readTime: '15 min read',
    category: 'Research',
    featured: true,
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-dark">
      <Particles />
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-zinc-300 mb-6">
            <FileText className="w-4 h-4" />
            Blog & Research
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Insights on Nutrition & Health
          </h1>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Research, insights, and stories about making informed food choices in the modern world
          </p>
        </div>

        {/* Featured Post */}
        {blogPosts.filter(post => post.featured).map((post) => (
          <Link 
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block mb-12 group"
          >
            <div className="card p-8 md:p-10 hover:border-white/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 text-xs font-semibold rounded-full border border-purple-500/30">
                  Featured
                </span>
                <span className="px-3 py-1 bg-white/5 text-zinc-400 text-xs font-medium rounded-full">
                  {post.category}
                </span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 group-hover:bg-clip-text transition-all">
                {post.title}
              </h2>
              
              <p className="text-lg text-zinc-400 mb-6 leading-relaxed">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {post.readTime}
                  </span>
                </div>
                
                <span className="flex items-center gap-2 text-white group-hover:gap-3 transition-all">
                  Read Article
                  <ArrowRight className="w-5 h-5" />
                </span>
              </div>
            </div>
          </Link>
        ))}

        {/* All Posts Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">All Articles</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <Link 
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="card p-6 hover:border-white/30 transition-all group"
              >
                <div className="mb-4">
                  <span className="px-3 py-1 bg-white/5 text-zinc-400 text-xs font-medium rounded-full">
                    {post.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 group-hover:bg-clip-text transition-all">
                  {post.title}
                </h3>
                
                <p className="text-zinc-400 mb-4 text-sm leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Newsletter CTA */}
        <div className="card p-8 text-center">
          <h3 className="text-2xl font-bold mb-3">Stay Updated</h3>
          <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
            Get notified when we publish new research and insights about nutrition, health, and making better food choices.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-white to-zinc-400 text-dark font-semibold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
              Subscribe
            </button>
          </div>
          <p className="text-xs text-zinc-600 mt-4">
            Coming soon. We'll never spam you or share your email.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
