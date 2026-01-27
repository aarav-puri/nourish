'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, TrendingUp, AlertTriangle, Users, Lightbulb, Calendar, Clock } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Particles from '@/components/Particles'

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-dark">
      <Particles />
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-20">
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-white/5 text-zinc-400 text-xs font-medium rounded-full">
              Research
            </span>
            <span className="flex items-center gap-1.5 text-sm text-zinc-500">
              <Calendar className="w-4 h-4" />
              January 20, 2026
            </span>
            <span className="flex items-center gap-1.5 text-sm text-zinc-500">
              <Clock className="w-4 h-4" />
              15 min read
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            The Nutrition Literacy Crisis and Ultra-Processed Foods
          </h1>
          
          <p className="text-xl text-zinc-400 mb-6">
            Understanding the growing health crisis and why tools like BarcodeSense matter
          </p>
        </div>

        {/* Key Statistics */}
        <div className="card p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Key Statistics
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="text-3xl font-bold gradient-text mb-2">73%</div>
              <p className="text-zinc-400">of the U.S. food supply is ultra-processed</p>
              <p className="text-xs text-zinc-600 mt-2">Source: Northeastern University</p>
            </div>
            
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="text-3xl font-bold gradient-text mb-2">60%</div>
              <p className="text-zinc-400">of adults have low nutrition literacy</p>
              <p className="text-xs text-zinc-600 mt-2">Source: Journal of Nutrition Education</p>
            </div>
            
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="text-3xl font-bold gradient-text mb-2">58%</div>
              <p className="text-zinc-400">of daily calories come from ultra-processed foods</p>
              <p className="text-xs text-zinc-600 mt-2">Source: BMJ Open</p>
            </div>
            
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="text-3xl font-bold gradient-text mb-2">32</div>
              <p className="text-zinc-400">harmful health effects linked to UPFs</p>
              <p className="text-xs text-zinc-600 mt-2">Source: BMJ Study 2024</p>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Executive Summary</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-zinc-300 leading-relaxed mb-4">
              The modern food landscape presents a critical public health challenge: the proliferation of 
              ultra-processed foods (UPFs) combined with widespread nutrition illiteracy. This research 
              examines the intersection of these two crises and explores how technology-driven solutions 
              can empower consumers to make healthier choices.
            </p>
            <p className="text-zinc-300 leading-relaxed">
              Ultra-processed foods now dominate the American diet, comprising nearly 60% of daily caloric 
              intake. Simultaneously, the majority of adults lack the nutrition literacy needed to understand 
              food labels and make informed dietary decisions. This perfect storm has contributed to rising 
              rates of obesity, diabetes, cardiovascular disease, and other diet-related health conditions.
            </p>
          </div>
        </section>

        {/* The Problem */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <AlertTriangle className="w-7 h-7" />
            The Problem: A Two-Fold Crisis
          </h2>
          
          <div className="space-y-8">
            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-4">1. The Ultra-Processed Food Epidemic</h3>
              <p className="text-zinc-300 leading-relaxed mb-4">
                Ultra-processed foods are industrial formulations typically containing five or more ingredients, 
                including substances not commonly used in culinary preparations such as hydrogenated oils, 
                modified starches, and protein isolates. These products are designed to be hyper-palatable, 
                convenient, and shelf-stable.
              </p>
              <ul className="space-y-2 text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>73% of the U.S. food supply consists of ultra-processed products</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Americans consume 58% of their daily calories from UPFs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>UPF consumption linked to 32 harmful health outcomes including obesity, type 2 diabetes, cardiovascular disease, and certain cancers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Higher UPF intake associated with increased mortality risk</span>
                </li>
              </ul>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-4">2. The Nutrition Literacy Gap</h3>
              <p className="text-zinc-300 leading-relaxed mb-4">
                Nutrition literacy—the ability to obtain, process, and understand basic nutrition information 
                to make appropriate dietary decisions—is alarmingly low among American adults. This knowledge 
                gap leaves consumers vulnerable to misleading marketing and unable to evaluate the nutritional 
                quality of their food choices.
              </p>
              <ul className="space-y-2 text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>60% of adults have low nutrition literacy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Many consumers cannot interpret nutrition labels correctly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Confusion about serving sizes, daily values, and ingredient lists is widespread</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Low nutrition literacy correlates with poorer diet quality and health outcomes</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Health Impacts */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Health Impacts of Ultra-Processed Foods</h2>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-zinc-300 leading-relaxed mb-6">
              A comprehensive 2024 umbrella review published in the British Medical Journal analyzed 45 
              meta-analyses involving nearly 10 million participants. The findings revealed consistent 
              associations between high UPF consumption and adverse health outcomes:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="card p-4">
                <h4 className="font-semibold text-white mb-2">Cardiovascular Health</h4>
                <p className="text-sm text-zinc-400">Increased risk of cardiovascular disease, hypertension, and cardiovascular mortality</p>
              </div>
              
              <div className="card p-4">
                <h4 className="font-semibold text-white mb-2">Metabolic Disorders</h4>
                <p className="text-sm text-zinc-400">Higher rates of type 2 diabetes, metabolic syndrome, and obesity</p>
              </div>
              
              <div className="card p-4">
                <h4 className="font-semibold text-white mb-2">Mental Health</h4>
                <p className="text-sm text-zinc-400">Links to depression, anxiety, and cognitive decline</p>
              </div>
              
              <div className="card p-4">
                <h4 className="font-semibold text-white mb-2">Cancer Risk</h4>
                <p className="text-sm text-zinc-400">Associations with certain types of cancer, particularly colorectal cancer</p>
              </div>
              
              <div className="card p-4">
                <h4 className="font-semibold text-white mb-2">Gastrointestinal Issues</h4>
                <p className="text-sm text-zinc-400">Increased risk of inflammatory bowel disease and other GI disorders</p>
              </div>
              
              <div className="card p-4">
                <h4 className="font-semibold text-white mb-2">Mortality</h4>
                <p className="text-sm text-zinc-400">Higher all-cause mortality rates among high UPF consumers</p>
              </div>
            </div>
            
            <p className="text-zinc-300 leading-relaxed">
              The mechanisms behind these health impacts are multifaceted, involving the displacement of 
              nutrient-dense whole foods, excessive intake of added sugars and unhealthy fats, high sodium 
              content, presence of food additives and contaminants, and disruption of normal satiety signals 
              leading to overconsumption.
            </p>
          </div>
        </section>

        {/* Why Nutrition Literacy Matters */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <Users className="w-7 h-7" />
            Why Nutrition Literacy Matters
          </h2>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-zinc-300 leading-relaxed mb-4">
              Nutrition literacy serves as a critical protective factor against poor dietary choices. 
              Individuals with higher nutrition literacy are better equipped to:
            </p>
            
            <ul className="space-y-3 text-zinc-300 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Interpret and apply information from nutrition labels</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Identify ultra-processed foods and understand their health implications</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Make informed decisions about portion sizes and serving frequencies</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Evaluate marketing claims and distinguish between healthy and unhealthy options</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Plan balanced meals that meet nutritional needs</span>
              </li>
            </ul>
            
            <p className="text-zinc-300 leading-relaxed">
              However, traditional approaches to improving nutrition literacy—such as educational campaigns 
              and simplified labeling—have shown limited effectiveness. The complexity of modern food products 
              and the overwhelming amount of nutritional information create barriers that education alone 
              cannot overcome.
            </p>
          </div>
        </section>

        {/* The Solution */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <Lightbulb className="w-7 h-7" />
            Technology as a Solution
          </h2>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-zinc-300 leading-relaxed mb-6">
              Digital tools represent a promising approach to bridging the nutrition literacy gap and helping 
              consumers navigate the ultra-processed food landscape. By leveraging artificial intelligence 
              and comprehensive product databases, applications like BarcodeSense can:
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="card p-5">
                <h4 className="font-semibold text-white mb-2">Simplify Complex Information</h4>
                <p className="text-zinc-400">
                  Transform dense nutrition labels and ingredient lists into clear, actionable insights that 
                  anyone can understand, regardless of their nutrition knowledge level.
                </p>
              </div>
              
              <div className="card p-5">
                <h4 className="font-semibold text-white mb-2">Provide Instant Analysis</h4>
                <p className="text-zinc-400">
                  Deliver real-time evaluation of products at the point of purchase, enabling informed 
                  decisions when they matter most—in the grocery store aisle.
                </p>
              </div>
              
              <div className="card p-5">
                <h4 className="font-semibold text-white mb-2">Offer Personalized Recommendations</h4>
                <p className="text-zinc-400">
                  Suggest healthier alternatives tailored to individual dietary needs, preferences, and 
                  restrictions, making it easier to choose better options.
                </p>
              </div>
              
              <div className="card p-5">
                <h4 className="font-semibold text-white mb-2">Identify Ultra-Processed Foods</h4>
                <p className="text-zinc-400">
                  Automatically flag ultra-processed products and explain why they may be problematic, 
                  helping consumers recognize and avoid these items.
                </p>
              </div>
              
              <div className="card p-5">
                <h4 className="font-semibold text-white mb-2">Educate Through Use</h4>
                <p className="text-zinc-400">
                  Gradually improve users' nutrition literacy through repeated exposure to nutritional 
                  concepts and explanations, creating lasting behavior change.
                </p>
              </div>
            </div>
            
            <p className="text-zinc-300 leading-relaxed">
              This technology-driven approach doesn't replace nutrition education but rather complements it 
              by providing practical, accessible support at the moment of decision-making. By reducing the 
              cognitive burden of evaluating food products, these tools empower consumers to make healthier 
              choices consistently.
            </p>
          </div>
        </section>

        {/* Conclusion */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Conclusion</h2>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-zinc-300 leading-relaxed mb-4">
              The convergence of widespread ultra-processed food consumption and low nutrition literacy 
              represents one of the most significant public health challenges of our time. With 73% of the 
              food supply being ultra-processed and 60% of adults lacking adequate nutrition literacy, the 
              need for innovative solutions has never been greater.
            </p>
            
            <p className="text-zinc-300 leading-relaxed mb-4">
              Technology-enabled tools like BarcodeSense offer a scalable, accessible approach to addressing 
              this crisis. By democratizing nutrition knowledge and making healthy choices easier, these 
              applications have the potential to shift dietary patterns at a population level.
            </p>
            
            <p className="text-zinc-300 leading-relaxed">
              As we move forward, the integration of artificial intelligence, comprehensive databases, and 
              user-friendly interfaces will be crucial in empowering consumers to navigate the complex modern 
              food environment. The goal is not just to inform, but to transform—creating a future where 
              healthy eating is the path of least resistance, not greatest effort.
            </p>
          </div>
        </section>

        {/* References */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Key References</h2>
          
          <div className="card p-6">
            <ul className="space-y-4 text-sm text-zinc-400">
              <li>
                <p className="text-zinc-300 font-medium mb-1">
                  Lane MM, et al. (2024). Ultra-processed food exposure and adverse health outcomes: 
                  umbrella review of epidemiological meta-analyses.
                </p>
                <p className="text-zinc-500">BMJ, 384:e077310</p>
              </li>
              
              <li>
                <p className="text-zinc-300 font-medium mb-1">
                  Martínez Steele E, et al. (2023). Ultra-processed foods, protein leverage and energy 
                  intake in the USA.
                </p>
                <p className="text-zinc-500">Public Health Nutrition, 26(2):341-350</p>
              </li>
              
              <li>
                <p className="text-zinc-300 font-medium mb-1">
                  Gibney MJ. (2023). Ultra-processed foods: definitions and policy issues.
                </p>
                <p className="text-zinc-500">Current Developments in Nutrition, 7(2):100013</p>
              </li>
              
              <li>
                <p className="text-zinc-300 font-medium mb-1">
                  Silk KJ, et al. (2008). An examination of nutrition literacy and its relationship to 
                  health outcomes.
                </p>
                <p className="text-zinc-500">Journal of Nutrition Education and Behavior, 40(3):145-151</p>
              </li>
              
              <li>
                <p className="text-zinc-300 font-medium mb-1">
                  Poti JM, et al. (2017). Is the degree of food processing and convenience linked with 
                  the nutritional quality of foods purchased by US households?
                </p>
                <p className="text-zinc-500">American Journal of Clinical Nutrition, 105(6):1433-1443</p>
              </li>
            </ul>
          </div>
        </section>



        {/* CTA */}
        <div className="card p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to make informed choices?</h3>
          <p className="text-zinc-400 mb-6">
            Start using BarcodeSense to understand what you're eating and discover healthier alternatives.
          </p>
          <Link href="/app">
            <button className="px-8 py-3 bg-gradient-to-r from-white to-zinc-400 text-dark font-semibold rounded-lg hover:opacity-90 transition-opacity">
              Try BarcodeSense Free
            </button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
