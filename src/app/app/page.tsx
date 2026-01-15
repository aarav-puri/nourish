'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, Search, ArrowLeft, X, Home, User, Sparkles, 
  Activity, Smile, CheckSquare, Leaf, Loader2, AlertCircle,
  Check, ChevronDown, LogOut, History
} from 'lucide-react'
import { auth, db } from '@/lib/supabase'
import { fetchProductInfo, ProductData } from '@/lib/product-api'
import { aiService, Product } from '@/lib/ai-service'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import AuthModal from '@/components/auth/AuthModal'
import { toast } from 'sonner'

export default function AppPage() {
  const [user, setUser] = useState<any>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasScanned, setHasScanned] = useState(false)
  const [barcode, setBarcode] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [productLoading, setProductLoading] = useState(false)
  const [product, setProduct] = useState<ProductData['product'] | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<{ title: string; content: any } | null>(null)
  const [moodModalOpen, setMoodModalOpen] = useState(false)
  const [dietModalOpen, setDietModalOpen] = useState(false)
  const [selectedDiets, setSelectedDiets] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    auth.getCurrentUser().then((currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    const { data: { subscription } } = auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await auth.signOut()
    setUserMenuOpen(false)
  }

  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file')
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const imageSrc = e.target?.result as string
      setImagePreview(imageSrc)
      setProductLoading(true)

      // Use Quagga for barcode detection
      if (typeof window !== 'undefined') {
        const Quagga = (await import('quagga')).default
        Quagga.decodeSingle({
          src: imageSrc,
          numOfWorkers: 0,
          decoder: {
            readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'code_39_reader', 'upc_reader', 'upc_e_reader']
          },
          locate: true
        }, (result: any) => {
          if (result?.codeResult?.code) {
            handleBarcodeDetected(result.codeResult.code)
          } else {
            setProductLoading(false)
            toast.error('No barcode detected. Try another image or enter manually.')
          }
        })
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const handleBarcodeDetected = async (code: string) => {
    setBarcode(code)
    toast.success(`Barcode detected: ${code}`)
    await searchProduct(code)
  }

  const searchProduct = async (code: string) => {
    if (!code.trim()) {
      toast.error('Please enter a barcode number')
      return
    }

    setProductLoading(true)
    try {
      const data = await fetchProductInfo(code)
      
      if (data.status === 0 || !data.product || Object.keys(data.product).length === 0) {
        setProduct(null)
        setShowResult(true)
      } else {
        setProduct(data.product)
        setShowResult(true)
        
        // Show sign-in prompt after first scan if not logged in
        if (!user && !hasScanned) {
          setHasScanned(true)
          setTimeout(() => {
            setAuthModalOpen(true)
          }, 1500) // Show after 1.5 seconds so user can see the result first
        }
        
        // Save to history if logged in
        if (user) {
          try {
            await db.saveScannedProduct(code, data.product.product_name || 'Unknown Product', data.product)
          } catch (err) {
            console.error('Failed to save product:', err)
          }
        }
      }
    } catch (err) {
      toast.error('Failed to fetch product information')
    } finally {
      setProductLoading(false)
    }
  }

  const handleAIFeature = async (feature: string, mood?: string) => {
    if (!product) return
    
    // Non-signed-in users must sign in to use AI features
    if (!user) {
      toast.error('Sign in to unlock AI insights.')
      setTimeout(() => setAuthModalOpen(true), 500)
      return
    }
    
    // Check AI usage limit (1 per day for signed-in users)
    const today = new Date().toDateString()
    const usageKey = `ai_usage_${user.id}`
    const usageData = localStorage.getItem(usageKey)
    
    let usage = { date: today, count: 0 }
    if (usageData) {
      usage = JSON.parse(usageData)
      // Reset count if it's a new day
      if (usage.date !== today) {
        usage = { date: today, count: 0 }
      }
    }
    
    if (usage.count >= 1) {
      toast.error('Daily AI limit reached. Come back tomorrow for more insights.')
      return
    }
    
    // Increment usage
    usage.count += 1
    localStorage.setItem(usageKey, JSON.stringify(usage))
    
    setAiLoading(true)
    setMoodModalOpen(false)
    setDietModalOpen(false)

    try {
      let result: string
      let title: string

      switch (feature) {
        case 'alternatives':
          title = 'Healthier Alternatives'
          result = await aiService.getHealthierSubstitutes(product as Product)
          break
        case 'mood':
          title = `Recommendations for ${mood}`
          result = await aiService.getMoodBasedRecommendations(mood!, product as Product)
          break
        case 'diet':
          title = 'Diet Compatibility'
          result = await aiService.analyzeDietCompatibility(product as Product, selectedDiets)
          break
        case 'eco':
          title = 'Environmental Impact'
          result = await aiService.analyzeEcoImpact(product as Product)
          break
        default:
          return
      }

      // Parse JSON result
      const cleanResult = result.replace(/```json\s*/g, '').replace(/```\s*/g, '')
      const parsed = JSON.parse(cleanResult)
      setAiResult({ title, content: parsed })
    } catch (err) {
      toast.error('AI analysis failed. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const resetScan = () => {
    setImagePreview(null)
    setBarcode('')
    setProduct(null)
    setShowResult(false)
    setAiResult(null)
  }

  const moods = ['Tired', 'Stressed', 'Energetic', 'Hungry After Workout', 'Relaxed', 'Focused']
  const diets = ['Vegan', 'Vegetarian', 'Keto', 'Paleo', 'Halal', 'Kosher', 'Gluten-Free']

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-card/95 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <Image src="/favicon.png" alt="BarcodeSense" width={40} height={40} />
            </div>
          </Link>
          
          {loading ? (
            <div className="w-32 h-10"></div>
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-elevated border border-zinc-700 hover:border-zinc-500 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white to-zinc-400 flex items-center justify-center overflow-hidden">
                  {user.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-dark" />
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-dark-card rounded-xl border border-zinc-800 shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <p className="text-sm text-zinc-400">Signed in as</p>
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/history"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <History className="w-4 h-4" />
                      Scan History
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button size="sm" onClick={() => setAuthModalOpen(true)}>Sign In</Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="btn-ghost flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <h1 className="text-2xl font-bold gradient-text">Scan Your Product</h1>
        </div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
        >
          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-zinc-500 transition-colors"
            >
              <Upload className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Barcode Image</h3>
              <p className="text-zinc-400 text-sm mb-4">Click to browse or drag and drop</p>
              <div className="text-xs text-zinc-500 space-y-1">
                <p>• Clear, well-lit barcode image</p>
                <p>• Barcode should be straight and in focus</p>
                <p>• Avoid shadows or glare</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-full rounded-xl" />
              <button
                onClick={resetScan}
                className="absolute top-2 right-2 p-2 bg-dark/80 rounded-full hover:bg-dark transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-dark text-zinc-500 text-sm">OR</span>
          </div>
        </div>

        {/* Manual Input */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Enter Barcode Manually</h3>
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Enter barcode number..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchProduct(barcode)}
              className="flex-1"
            />
            <Button onClick={() => searchProduct(barcode)} loading={productLoading}>
              <Search className="w-5 h-5" />
              Search
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {productLoading && (
          <div className="card text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
            <p className="text-zinc-400">Analyzing product...</p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {showResult && !productLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold gradient-text">Product Details</h2>
                <button onClick={resetScan} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {product ? (
                <div className="space-y-6">
                  {/* Product Image */}
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.product_name || 'Product'}
                      className="w-full max-w-xs mx-auto rounded-xl"
                    />
                  )}

                  {/* Product Info */}
                  <div className="space-y-4">
                    {/* Product Name & Brand */}
                    {(product.product_name || product.brands) && (
                      <div className="p-5 bg-gradient-to-br from-white/10 to-white/5 rounded-xl border border-white/10">
                        {product.product_name && (
                          <div className="mb-3">
                            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Product Name</p>
                            <p className="text-lg font-bold text-white">{product.product_name}</p>
                          </div>
                        )}
                        {product.brands && (
                          <div>
                            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Brand</p>
                            <p className="text-base font-semibold text-zinc-200">{product.brands}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ingredients */}
                    {product.ingredients_text && (
                      <div className="p-5 bg-white/5 rounded-xl border border-zinc-800">
                        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                          Ingredients
                        </p>
                        <p className="text-sm leading-relaxed text-zinc-300">
                          {product.ingredients_text}
                        </p>
                      </div>
                    )}

                    {/* Nutrition Facts */}
                    {product.nutriments && (
                      <div className="p-5 bg-white/5 rounded-xl border border-zinc-800">
                        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                          Nutrition Facts (per 100g)
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          {product.nutriments.energy_value && (
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-zinc-500 mb-1">Energy</p>
                              <p className="text-lg font-bold text-white">
                                {product.nutriments.energy_value}
                                <span className="text-sm text-zinc-400 ml-1">
                                  {product.nutriments.energy_unit || 'kcal'}
                                </span>
                              </p>
                            </div>
                          )}
                          {product.nutriments.fat !== undefined && (
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-zinc-500 mb-1">Fat</p>
                              <p className="text-lg font-bold text-white">
                                {product.nutriments.fat}
                                <span className="text-sm text-zinc-400 ml-1">g</span>
                              </p>
                            </div>
                          )}
                          {product.nutriments.carbohydrates !== undefined && (
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-zinc-500 mb-1">Carbs</p>
                              <p className="text-lg font-bold text-white">
                                {product.nutriments.carbohydrates}
                                <span className="text-sm text-zinc-400 ml-1">g</span>
                              </p>
                            </div>
                          )}
                          {product.nutriments.proteins !== undefined && (
                            <div className="p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-zinc-500 mb-1">Protein</p>
                              <p className="text-lg font-bold text-white">
                                {product.nutriments.proteins}
                                <span className="text-sm text-zinc-400 ml-1">g</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Features */}
                  <div className="border-t border-zinc-800 pt-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                      <Sparkles className="w-5 h-5" />
                      AI Insights
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => handleAIFeature('alternatives')}
                        disabled={aiLoading}
                        className="flex-col h-auto py-4"
                      >
                        <Activity className="w-6 h-6 mb-2" />
                        <span className="text-sm">Healthier Alternatives</span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setMoodModalOpen(true)}
                        disabled={aiLoading}
                        className="flex-col h-auto py-4"
                      >
                        <Smile className="w-6 h-6 mb-2" />
                        <span className="text-sm">Mood Recommendations</span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setDietModalOpen(true)}
                        disabled={aiLoading}
                        className="flex-col h-auto py-4"
                      >
                        <CheckSquare className="w-6 h-6 mb-2" />
                        <span className="text-sm">Diet Compatibility</span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleAIFeature('eco')}
                        disabled={aiLoading}
                        className="flex-col h-auto py-4"
                      >
                        <Leaf className="w-6 h-6 mb-2" />
                        <span className="text-sm">Eco Score</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Product Not Found</h3>
                  <p className="text-zinc-400 mb-4">We couldn't find this product in our database.</p>
                  <p className="text-sm text-zinc-500">Barcode: {barcode}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-dark-card/95 backdrop-blur-lg border-t border-zinc-800 md:hidden">
        <div className="flex justify-around py-3">
          <Link href="/" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors">
            <Home className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/app" className="flex flex-col items-center gap-1 text-white">
            <Upload className="w-6 h-6" />
            <span className="text-xs">Scan</span>
          </Link>
          <button
            onClick={() => user ? null : setAuthModalOpen(true)}
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors"
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>

      {/* Mood Selection Modal */}
      <Modal isOpen={moodModalOpen} onClose={() => setMoodModalOpen(false)} title="How are you feeling?">
        <div className="grid grid-cols-2 gap-3">
          {moods.map((mood) => (
            <Button
              key={mood}
              variant="secondary"
              onClick={() => handleAIFeature('mood', mood)}
              className="py-4"
            >
              {mood}
            </Button>
          ))}
        </div>
      </Modal>

      {/* Diet Selection Modal */}
      <Modal isOpen={dietModalOpen} onClose={() => setDietModalOpen(false)} title="Select Diets to Check">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {diets.map((diet) => (
              <label
                key={diet}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  selectedDiets.includes(diet)
                    ? 'border-white bg-white/10'
                    : 'border-zinc-700 hover:border-zinc-500'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedDiets.includes(diet)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDiets([...selectedDiets, diet])
                    } else {
                      setSelectedDiets(selectedDiets.filter((d) => d !== diet))
                    }
                  }}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                  selectedDiets.includes(diet) ? 'bg-white border-white' : 'border-zinc-600'
                }`}>
                  {selectedDiets.includes(diet) && <Check className="w-3 h-3 text-dark" />}
                </div>
                <span>{diet}</span>
              </label>
            ))}
          </div>
          <Button
            onClick={() => handleAIFeature('diet')}
            disabled={selectedDiets.length === 0}
            className="w-full"
          >
            Check Compatibility
          </Button>
        </div>
      </Modal>

      {/* AI Result Modal */}
      <Modal
        isOpen={!!aiResult}
        onClose={() => setAiResult(null)}
        title={aiResult?.title}
        size="lg"
      >
        {aiResult && <AIResultDisplay content={aiResult.content} />}
      </Modal>

      {/* AI Loading Overlay */}
      {aiLoading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
            <p className="text-zinc-300">Analyzing with AI...</p>
          </div>
        </div>
      )}

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        showSaveMessage={hasScanned && !user}
      />
    </div>
  )
}

// AI Result Display Component
function AIResultDisplay({ content }: { content: any }) {
  if (Array.isArray(content)) {
    // Alternatives or Mood recommendations
    return (
      <div className="space-y-4">
        {content.map((item, i) => (
          <div key={i} className="p-4 bg-white/5 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                {i + 1}
              </span>
              <div className="flex-1">
                <h4 className="font-semibold mb-2">{item.product_name || item.food_name}</h4>
                {item.why_healthier && <p className="text-sm text-zinc-400 mb-2">{item.why_healthier}</p>}
                {item.why_helps && <p className="text-sm text-zinc-400 mb-2">{item.why_helps}</p>}
                {item.flavor_similarity && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-500">Similarity:</span>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-white to-zinc-400"
                        style={{ width: `${item.flavor_similarity * 10}%` }}
                      />
                    </div>
                    <span>{item.flavor_similarity}/10</span>
                  </div>
                )}
                {item.energy_level && (
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${
                    item.energy_level === 'Boost' ? 'bg-yellow-500/20 text-yellow-400' :
                    item.energy_level === 'Calm' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {item.energy_level}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Eco score or Diet compatibility
  if (content.overall_score !== undefined) {
    // Eco score
    const score = content.overall_score
    const scoreClass = score >= 7 ? 'text-green-400' : score >= 4 ? 'text-yellow-400' : 'text-red-400'
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={`text-6xl font-bold ${scoreClass}`}>{score}/10</div>
          <p className="text-zinc-400 mt-2">Environmental Impact Score</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {['carbon_footprint', 'water_usage', 'transportation_impact'].map((key) => (
            content[key] && (
              <div key={key} className="p-4 bg-white/5 rounded-xl">
                <p className="text-sm text-zinc-400 capitalize">{key.replace(/_/g, ' ')}</p>
                <p className={`font-semibold ${
                  content[key] === 'Low' ? 'text-green-400' :
                  content[key] === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                }`}>{content[key]}</p>
              </div>
            )
          ))}
        </div>

        {content.explanation && (
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-zinc-400 mb-2">Analysis</p>
            <p>{content.explanation}</p>
          </div>
        )}

        {content.tips && (
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-zinc-400 mb-2">Eco-Friendly Tips</p>
            <ul className="space-y-2">
              {content.tips.map((tip: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <Leaf className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  // Diet compatibility
  return (
    <div className="space-y-4">
      {Object.entries(content).map(([diet, info]: [string, any]) => (
        <div
          key={diet}
          className={`p-4 rounded-xl border ${
            info.compatible === 'Yes' ? 'border-green-500/30 bg-green-500/10' :
            info.compatible === 'Maybe' ? 'border-yellow-500/30 bg-yellow-500/10' :
            'border-red-500/30 bg-red-500/10'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">{diet}</h4>
            <span className={`px-3 py-1 rounded-full text-sm ${
              info.compatible === 'Yes' ? 'bg-green-500/20 text-green-400' :
              info.compatible === 'Maybe' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {info.compatible}
            </span>
          </div>
          <p className="text-sm text-zinc-400">{info.reason}</p>
          {info.concerns && info.concerns !== 'null' && (
            <p className="text-sm text-red-400 mt-2">⚠️ {info.concerns}</p>
          )}
          {info.alternatives && info.alternatives !== 'null' && (
            <p className="text-sm text-zinc-300 mt-2">💡 {info.alternatives}</p>
          )}
        </div>
      ))}
    </div>
  )
}
