'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Search, ArrowLeft, X, Home, User, Sparkles,
  Activity, CheckSquare, Leaf, Loader2, AlertCircle,
  Check, ChevronDown, LogOut, History, ChefHat, ScanLine, Settings,
  Timer, Flame, TriangleAlert, Lightbulb
} from 'lucide-react'
import { auth, db } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { fetchProductInfo, ProductData } from '@/lib/product-api'
import { aiService, Product, getGeminiApiKey } from '@/lib/ai-service'
import Button from '@/components/ui/Button'
import SiteBackground from '@/components/brand/SiteBackground'
import ScoreMeter from '@/components/product/ScoreMeter'
import EcoBars from '@/components/product/EcoBars'
import DataRow from '@/components/product/DataRow'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'

export default function AppPage() {
  const { user, loading, requireSignIn } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [barcode, setBarcode] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [productLoading, setProductLoading] = useState(false)
  const [product, setProduct] = useState<ProductData['product'] | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<{ title: string; content: any } | null>(null)
  const [dietModalOpen, setDietModalOpen] = useState(false)
  const [selectedDiets, setSelectedDiets] = useState<string[]>([])
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [manualEntryMode, setManualEntryMode] = useState(false)
  const [manualProduct, setManualProduct] = useState({
    product_name: '',
    brands: '',
    ingredients_text: '',
    nutriments: {
      energy_value: '',
      fat: '',
      carbohydrates: '',
      proteins: ''
    }
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }
    checkMobile()

    setApiKey(getGeminiApiKey())
  }, [])

  useEffect(() => {
    // Not signed in: send them to the sign in page.
    if (!loading && !user) {
      requireSignIn()
    }
  }, [loading, user])

  const handleLogout = async () => {
    await auth.signOut()
    setUserMenuOpen(false)
  }

  const handleImageUpload = useCallback((file: File) => {
    // Require sign in
    if (!user) {
      toast.error('Please sign in to scan products')
      requireSignIn()
      return
    }

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
            readers: [
              'ean_reader',       // EAN-13, EAN-8
              'ean_8_reader',     // EAN-8 specifically
              'code_128_reader',  // Code 128
              'code_39_reader',   // Code 39
              'upc_reader',       // UPC-A
              'upc_e_reader',     // UPC-E
              'codabar_reader',   // Codabar
              'i2of5_reader',     // Interleaved 2 of 5
            ]
          },
          locate: true,
          multiple: false
        } as any, (result: any) => {
          if (result?.codeResult?.code) {
            const code = result.codeResult.code
            // Validate barcode (basic check)
            if (code && code.length >= 8) {
              handleBarcodeDetected(code)
            } else {
              setProductLoading(false)
              setProduct(null)
              setShowResult(true)
              setBarcode('')
              toast.error('Invalid barcode detected.')
            }
          } else {
            setProductLoading(false)
            setProduct(null)
            setShowResult(true)
            setBarcode('')
            toast.error('No barcode found in image.')
          }
        })
      }
    }
    reader.readAsDataURL(file)
  }, [user])

  // Handle drag and drop
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))

    if (imageFile) {
      handleImageUpload(imageFile)
    } else {
      toast.error('Please drop an image file')
    }
  }, [handleImageUpload])

  // Handle paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            handleImageUpload(file)
            toast.success('Image pasted! Scanning...')
          }
          break
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handleImageUpload])

  const handleBarcodeDetected = async (code: string) => {
    setBarcode(code)
    toast.success(`Barcode detected: ${code}`)
    await searchProduct(code)
  }

  const searchProduct = async (code: string) => {
    // Require sign in
    if (!user) {
      toast.error('Please sign in to scan products')
      requireSignIn()
      return
    }

    if (!code.trim()) {
      toast.error('Please enter a barcode number')
      return
    }

    setProductLoading(true)
    setManualEntryMode(false) // Reset manual entry mode when searching
    try {
      const data = await fetchProductInfo(code)

      if (data.status === 0 || !data.product || Object.keys(data.product).length === 0) {
        setProduct(null)
        setShowResult(true)
      } else {
        setProduct(data.product)
        setShowResult(true)

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
    // All features require a product
    if (!product) return

    // Non signed-in users must sign in to use AI features
    if (!user) {
      toast.error('Sign in to use AI insights.')
      setTimeout(() => requireSignIn({ reason: 'save' }), 500)
      return
    }

    // AI features require the user's own Gemini API key
    if (!apiKey) {
      toast.error('Add your BYOK key in Settings to use AI insights.')
      setProfileModalOpen(true)
      setDietModalOpen(false)
      return
    }

    setAiLoading(true)
    setDietModalOpen(false)

    try {
      let result: string
      let title: string
      let insightType: string

      switch (feature) {
        case 'alternatives':
          title = 'Healthier Alternatives'
          insightType = 'alternatives'
          result = await aiService.getHealthierSubstitutes(product as Product)
          break
        case 'diet':
          title = 'Diet Compatibility'
          insightType = 'diet_compatibility'
          result = await aiService.analyzeDietCompatibility(product as Product, selectedDiets)
          break
        case 'eco':
          title = 'Environmental Impact'
          insightType = 'eco_impact'
          result = await aiService.analyzeEcoImpact(product as Product)
          break
        case 'recipes':
          title = 'Recipe Ideas'
          insightType = 'recipe_suggestions'
          result = await aiService.getRecipeSuggestions(product as Product)
          break
        default:
          return
      }

      // Parse JSON result
      const cleanResult = result.replace(/```json\s*/g, '').replace(/```\s*/g, '')
      const parsed = JSON.parse(cleanResult)
      setAiResult({ title, content: parsed })

      // Save AI insight to database
      try {
        await db.saveAIInsight(
          barcode,
          product.product_name || 'Unknown Product',
          insightType,
          { title, content: parsed }
        )
      } catch (err) {
        console.error('Failed to save AI insight:', err)
        // Don't show error to user, insight is still displayed
      }
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
    setManualEntryMode(false) // Reset manual entry mode
  }

  const diets = ['Vegan', 'Vegetarian', 'Keto', 'Paleo', 'Halal', 'Kosher', 'Gluten Free']

  // Show loading or sign in required screen
  if (loading) {
    return (
      <div className="min-h-dvh bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  // The effect above is already navigating to /signin; this is the brief
  // state in between, and the manual link covers a blocked redirect.
  if (!user) {
    return (
      <div className="min-h-dvh bg-dark flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Image src="/favicon.png" alt="" width={56} height={56} className="mx-auto mb-6 h-14 w-14 object-contain" />
          <h1 className="t-h3 mb-3">Sign in to continue</h1>
          <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
            Taking you to the sign in page. The scanner is free and unlimited once you are in.
          </p>
          <Link href="/signin?next=%2Fapp" className="btn-primary w-full">
            Go to sign in
          </Link>
          <Link href="/" className="btn-ghost mt-3 w-full">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-black">
      <SiteBackground />

      {/* Header: the same capsule the marketing pages use, so moving from the
          site into the product does not feel like changing products. */}
      <header className="sticky top-0 z-50 px-4 pt-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-full border border-white/10 bg-black/70 px-4 py-2.5 backdrop-blur-xl">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="BarcodeSense home">
            <Image src="/favicon.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="font-display text-base font-bold tracking-tight">BarcodeSense</span>
          </Link>

          {loading ? (
            <div className="w-32 h-10 hidden md:block"></div>
          ) : user ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label="Account menu"
                className="flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 transition-colors hover:border-white/30"
              >
                <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white">
                  {user.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-black" aria-hidden="true" />
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b from-zinc-900 to-black shadow-2xl shadow-black/70">
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-label text-zinc-500">Signed in as</p>
                    <p className="mt-1 truncate text-sm font-medium">{user.email}</p>
                  </div>

                  <div className="py-2">
                    <Link
                      href="/settings"
                      className="flex min-h-11 items-center gap-3 px-4 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" aria-hidden="true" />
                      Settings
                    </Link>
                    <Link
                      href="/history"
                      className="flex min-h-11 items-center gap-3 px-4 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <History className="h-4 w-4" aria-hidden="true" />
                      Scan History
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-1 flex min-h-11 w-full items-center gap-3 border-t border-white/10 px-4 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/signin?next=%2Fapp" className="btn-primary min-h-11 px-5 text-xs">
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main id="main" className="relative z-10 mx-auto max-w-2xl px-4 pb-28 pt-10">
        <h1 className="sr-only">Scanner</h1>

        {/* Scan Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {/* Upload, with drag and drop. The clickable target is a real
              button so the keyboard can reach it; the drop handlers sit on
              the wrapper, and the file input lives outside the button
              because nesting one inside is invalid. */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`overflow-hidden rounded-2xl border transition-colors duration-200 ${isDragging
                ? 'border-white bg-white/[0.08]'
                : 'border-white/10 bg-gradient-to-b from-zinc-900/60 to-black hover:border-white/25'
              }`}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-6 py-10 text-center"
            >
              <Upload className={`mx-auto mb-4 h-10 w-10 transition-colors ${isDragging ? 'text-white' : 'text-zinc-500'
                }`} aria-hidden="true" />
              <span className="block font-display text-lg font-semibold tracking-tight">
                {isDragging ? 'Drop it here' : 'Upload a photo'}
              </span>
              {isDragging && (
                <span className="mt-2 block text-sm text-zinc-400">
                  Release to read the barcode
                </span>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Upload a photo of a barcode"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            />
          </div>
        </motion.div>

        {/* Image Preview */}
        {imagePreview && !showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-black p-3"
          >
            <div className="relative">
              <img src={imagePreview} alt="The photo you uploaded" className="w-full rounded-xl" />
              <button
                type="button"
                onClick={resetScan}
                aria-label="Remove this photo"
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/80 backdrop-blur-md transition-colors hover:bg-black"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Divider */}
        <div className="my-7 flex items-center gap-4" aria-hidden="true">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] font-bold uppercase tracking-label text-zinc-600">or</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        {/* Manual Input */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-black p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Enter a barcode manually
          </h2>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start">
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              label="Barcode number"
              placeholder="8712100843792"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchProduct(barcode)}
              className="flex-1"
            />
            <Button
              onClick={() => searchProduct(barcode)}
              loading={productLoading}
              className="shrink-0 whitespace-nowrap sm:mt-[26px]"
              icon={<Search className="h-4 w-4" aria-hidden="true" />}
            >
              Look up
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {productLoading && (
          <div
            role="status"
            className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-black px-6 py-14 text-center"
          >
            <Loader2 className="mx-auto mb-5 h-8 w-8 animate-spin text-white" aria-hidden="true" />
            <p className="font-display text-lg font-semibold tracking-tight">Reading the label</p>
            <p className="mt-2 text-sm text-zinc-400">
              Looking up the product and calculating its score.
            </p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {showResult && !productLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-black p-6 sm:p-7"
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="t-h3">Scan result</h2>
                <button
                  type="button"
                  onClick={resetScan}
                  aria-label="Clear this result and scan again"
                  className="btn-icon -mr-1"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {product ? (
                <div className="space-y-6">
                  {/* Product Info */}
                  <div className="space-y-4">
                    {/* Product Name & Brand */}
                    {((product as any).ai_formatted || product.product_name || product.brands) && (
                      <div>
                        <h3 className="font-display text-2xl font-bold tracking-tight">
                          {(product as any).ai_formatted?.formatted_name || product.product_name || 'Unnamed product'}
                        </h3>
                        {((product as any).ai_formatted?.formatted_brand || product.brands) && (
                          <p className="mt-1 text-sm text-zinc-400">
                            {(product as any).ai_formatted?.formatted_brand || product.brands}
                          </p>
                        )}
                      </div>
                    )}

                    <ScoreMeter grade={product.nutriscore_grade} />
                    <EcoBars grade={product.ecoscore_grade} />

                    {/* Key Highlights */}
                    {(product as any).ai_formatted?.key_highlights && (product as any).ai_formatted.key_highlights.length > 0 && (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                        <p className="text-xs font-bold uppercase tracking-label text-zinc-500">
                          What stands out
                        </p>
                        <ul className="m-0 mt-4 list-none">
                          {(product as any).ai_formatted.key_highlights.map((highlight: string, idx: number) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 border-b border-white/10 py-2.5 text-sm leading-relaxed text-zinc-300 last:border-b-0"
                            >
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" aria-hidden="true" />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Ingredients */}
                    {((product as any).ai_formatted?.formatted_ingredients || product.ingredients_text) && (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                        <div className="mb-4 flex items-baseline justify-between gap-4">
                          <p className="text-xs font-bold uppercase tracking-label text-zinc-500">
                            Ingredients
                          </p>
                          <p className="font-mono text-[11px] uppercase tracking-label text-zinc-400">
                            {((product as any).ai_formatted?.formatted_ingredients || product.ingredients_text).split(',').length} listed
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {((product as any).ai_formatted?.formatted_ingredients || product.ingredients_text).split(',').map((ingredient: string, idx: number) => {
                            const trimmed = ingredient.trim().toLowerCase()
                            const isFirst = idx < 3
                            return (
                              <span
                                key={idx}
                                className={`rounded-full border px-3 py-1.5 text-sm
                                  ${isFirst
                                    ? 'border-white bg-white font-medium text-black'
                                    : 'border-white/12 text-zinc-300'
                                  }`}
                              >
                                {ingredient.trim()}
                              </span>
                            )
                          })}
                        </div>
                        <p className="mt-4 text-xs text-zinc-500">
                          Ingredients are listed by weight, so the first three make up most of
                          what is inside.
                        </p>
                      </div>
                    )}

                    {/* Nutrition Facts */}
                    {product.nutriments && (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                        <p className="mb-4 text-xs font-bold uppercase tracking-label text-zinc-500">
                          Nutrition, per 100g
                        </p>
                        <div>
                          {product.nutriments.energy_value !== undefined && (
                            <DataRow
                              label="Energy"
                              value={`${Math.round(Number(product.nutriments.energy_value))} ${product.nutriments.energy_unit || 'kcal'}`}
                            />
                          )}
                          {product.nutriments.sugars !== undefined && (
                            <DataRow
                              label="Sugars"
                              strong
                              value={`${Number(product.nutriments.sugars).toFixed(1)}g`}
                            />
                          )}
                          {product.nutriments.fat !== undefined && (
                            <DataRow label="Fat" value={`${Number(product.nutriments.fat).toFixed(1)}g`} />
                          )}
                          {product.nutriments.carbohydrates !== undefined && (
                            <DataRow
                              label="Carbohydrates"
                              value={`${Number(product.nutriments.carbohydrates).toFixed(1)}g`}
                            />
                          )}
                          {product.nutriments.proteins !== undefined && (
                            <DataRow
                              label="Protein"
                              value={`${Number(product.nutriments.proteins).toFixed(1)}g`}
                            />
                          )}
                          {product.nutriments.salt !== undefined && (
                            <DataRow label="Salt" value={`${Number(product.nutriments.salt).toFixed(2)}g`} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Features */}
                  <div className="border-t border-white/10 pt-6">
                    <p className="mb-4 text-xs font-bold uppercase tracking-label text-zinc-500">
                      Go further
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => handleAIFeature('alternatives')}
                        disabled={aiLoading}
                        className="flex-col h-auto py-4"
                      >
                        <Activity className="w-6 h-6 mb-2" />
                        <span className="text-sm">A better option</span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleAIFeature('recipes')}
                        disabled={aiLoading}
                        className="flex-col h-auto py-4"
                      >
                        <ChefHat className="w-6 h-6 mb-2" />
                        <span className="text-sm">Something to cook</span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleAIFeature('eco')}
                        disabled={aiLoading}
                        className="flex-col h-auto py-4"
                      >
                        <Leaf className="w-6 h-6 mb-2" />
                        <span className="text-sm">Footprint detail</span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setDietModalOpen(true)}
                        disabled={aiLoading}
                        className="flex-col h-auto py-4"
                      >
                        <CheckSquare className="w-6 h-6 mb-2" />
                        <span className="text-sm">Check my diet</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : manualEntryMode ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-semibold tracking-tight">Enter the product details</h3>
                    <button
                      onClick={() => {
                        setManualEntryMode(false)
                        setManualProduct({
                          product_name: '',
                          brands: '',
                          ingredients_text: '',
                          nutriments: { energy_value: '', fat: '', carbohydrates: '', proteins: '' }
                        })
                      }}
                      className="text-zinc-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Product name *</label>
                      <Input
                        value={manualProduct.product_name}
                        onChange={(e) => setManualProduct({ ...manualProduct, product_name: e.target.value })}
                        placeholder="e.g., Organic Granola Bar"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Brand (optional)</label>
                      <Input
                        value={manualProduct.brands}
                        onChange={(e) => setManualProduct({ ...manualProduct, brands: e.target.value })}
                        placeholder="e.g., Nature Valley"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Ingredients *</label>
                      <textarea
                        value={manualProduct.ingredients_text}
                        onChange={(e) => setManualProduct({ ...manualProduct, ingredients_text: e.target.value })}
                        placeholder="e.g., Whole grain oats, honey, almonds, brown sugar..."
                        className="input-field min-h-[100px] resize-none"
                        rows={4}
                      />
                      <p className="text-xs text-zinc-500 mt-1">Separate ingredients with commas</p>
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-3">Nutrition per 100g, optional</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Energy (kcal)</label>
                          <Input
                            type="number"
                            value={manualProduct.nutriments.energy_value}
                            onChange={(e) => setManualProduct({
                              ...manualProduct,
                              nutriments: { ...manualProduct.nutriments, energy_value: e.target.value }
                            })}
                            placeholder="400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Fat (g)</label>
                          <Input
                            type="number"
                            value={manualProduct.nutriments.fat}
                            onChange={(e) => setManualProduct({
                              ...manualProduct,
                              nutriments: { ...manualProduct.nutriments, fat: e.target.value }
                            })}
                            placeholder="15"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Carbs (g)</label>
                          <Input
                            type="number"
                            value={manualProduct.nutriments.carbohydrates}
                            onChange={(e) => setManualProduct({
                              ...manualProduct,
                              nutriments: { ...manualProduct.nutriments, carbohydrates: e.target.value }
                            })}
                            placeholder="60"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Protein (g)</label>
                          <Input
                            type="number"
                            value={manualProduct.nutriments.proteins}
                            onChange={(e) => setManualProduct({
                              ...manualProduct,
                              nutriments: { ...manualProduct.nutriments, proteins: e.target.value }
                            })}
                            placeholder="8"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (!manualProduct.product_name || !manualProduct.ingredients_text) {
                        toast.error('Please fill in product name and ingredients')
                        return
                      }
                      // Convert to product format and set
                      const formattedProduct = {
                        ...manualProduct,
                        barcode: barcode,
                        nutriments: {
                          energy_value: parseFloat(manualProduct.nutriments.energy_value) || undefined,
                          energy_unit: 'kcal',
                          fat: parseFloat(manualProduct.nutriments.fat) || undefined,
                          carbohydrates: parseFloat(manualProduct.nutriments.carbohydrates) || undefined,
                          proteins: parseFloat(manualProduct.nutriments.proteins) || undefined,
                        }
                      }
                      setProduct(formattedProduct as any)
                      setManualEntryMode(false)
                      toast.success('Product details saved! Use AI insights below.')
                    }}
                    className="w-full"
                  >
                    Save & Analyze with AI
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {barcode ? 'Product Not Found' : 'No Barcode Detected'}
                  </h3>
                  <p className="text-zinc-400 mb-2">
                    {barcode
                      ? "We couldn't find this product in our database."
                      : "We couldn't detect a barcode in the uploaded image."}
                  </p>
                  {barcode && <p className="text-sm text-zinc-500 mb-6">Barcode: {barcode}</p>}

                  <div className="max-w-md mx-auto space-y-4">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-left">
                      <p className="text-sm text-blue-300 mb-2">
                        <Sparkles className="w-4 h-4 inline mr-1" />
                        What would you like to do?
                      </p>
                      <p className="text-xs text-zinc-400">
                        {barcode
                          ? 'You can try entering the barcode again, or manually enter product details for AI analysis.'
                          : 'You can manually enter the barcode or full product details for AI analysis.'}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      <Button
                        onClick={() => {
                          setShowResult(false)
                          setBarcode('')
                          setImagePreview(null)
                        }}
                        variant="secondary"
                        className="w-full"
                      >
                        <Search className="w-5 h-5" />
                        {barcode ? 'Try Different Barcode' : 'Enter Barcode Manually'}
                      </Button>

                      <Button
                        onClick={() => setManualEntryMode(true)}
                        className="w-full"
                      >
                        <Sparkles className="w-5 h-5" />
                        Enter Product Details Manually
                      </Button>
                    </div>
                  </div>
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
            onClick={() => setProfileModalOpen(true)}
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors"
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>

      {/* Diet Selection Modal */}
      <Modal isOpen={dietModalOpen} onClose={() => setDietModalOpen(false)} title="Select Diets to Check">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {diets.map((diet) => (
              <label
                key={diet}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${selectedDiets.includes(diet)
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
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedDiets.includes(diet) ? 'bg-white border-white' : 'border-zinc-600'
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

      {/* Profile Modal (Mobile) */}
      <Modal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} title="Profile">
        <div className="space-y-3">
          <div className="p-3 bg-white/5 rounded-xl border border-zinc-800">
            <p className="text-xs text-zinc-400 mb-1">Signed in as</p>
            <p className="text-sm font-medium truncate">{user?.email}</p>
          </div>

          <Link href="/settings" onClick={() => setProfileModalOpen(false)} className="block">
            <Button variant="secondary" className="w-full justify-center">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Button>
          </Link>

          <Link href="/history" onClick={() => setProfileModalOpen(false)} className="block">
            <Button variant="secondary" className="w-full justify-center">
              <History className="w-4 h-4" />
              <span>History</span>
            </Button>
          </Link>

          <Button
            onClick={() => {
              handleLogout()
              setProfileModalOpen(false)
            }}
            variant="secondary"
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 justify-center"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
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
            <p className="text-zinc-300">Analyzing</p>
          </div>
        </div>
      )}
    </div>
  )
}

// AI Result Display Component
function AIResultDisplay({ content }: { content: any }) {
  if (Array.isArray(content)) {
    // Check if it's recipes (has recipe_name)
    if (content[0]?.recipe_name) {
      return (
        <div className="space-y-4">
          {content.map((recipe, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{recipe.recipe_name}</h4>
                  <p className="text-sm text-zinc-400 mb-3">{recipe.description}</p>

                  <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
                    <span className={`px-2 py-1 rounded ${recipe.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                        recipe.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                      }`}>
                      {recipe.difficulty}
                    </span>
                    <span className="inline-flex items-center gap-1.5"><Timer className="h-3.5 w-3.5" aria-hidden="true" />{recipe.prep_time} min</span>
                    {recipe.calories && <span className="inline-flex items-center gap-1.5"><Flame className="h-3.5 w-3.5" aria-hidden="true" />{recipe.calories} cal</span>}
                  </div>

                  {recipe.other_ingredients && (
                    <div className="mb-3">
                      <p className="text-xs text-zinc-500 mb-1">Other ingredients needed:</p>
                      <div className="flex flex-wrap gap-1">
                        {recipe.other_ingredients.map((ing: string, idx: number) => (
                          <span key={idx} className="text-xs px-2 py-0.5 bg-white/5 rounded">
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipe.health_benefits && (
                    <p className="text-xs text-zinc-400">{recipe.health_benefits}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

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
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${item.energy_level === 'Boost' ? 'bg-yellow-500/20 text-yellow-400' :
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
          <p className="text-zinc-400 mt-2">Environmental impact score</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {['carbon_footprint', 'water_usage', 'transportation_impact'].map((key) => (
            content[key] && (
              <div key={key} className="p-4 bg-white/5 rounded-xl">
                <p className="text-sm text-zinc-400 capitalize">{key.replace(/_/g, ' ')}</p>
                <p className={`font-semibold ${content[key] === 'Low' ? 'text-green-400' :
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
            <p className="text-sm text-zinc-400 mb-2">Eco Friendly Tips</p>
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
          className={`p-4 rounded-xl border ${info.compatible === 'Yes' ? 'border-green-500/30 bg-green-500/10' :
              info.compatible === 'Maybe' ? 'border-yellow-500/30 bg-yellow-500/10' :
                'border-red-500/30 bg-red-500/10'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">{diet}</h4>
            <span className={`px-3 py-1 rounded-full text-sm ${info.compatible === 'Yes' ? 'bg-green-500/20 text-green-400' :
                info.compatible === 'Maybe' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
              }`}>
              {info.compatible}
            </span>
          </div>
          <p className="text-sm text-zinc-400">{info.reason}</p>
          {info.concerns && info.concerns !== 'null' && (
            <p className="mt-2 flex items-start gap-2 text-sm text-red-400"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{info.concerns}</p>
          )}
          {info.alternatives && info.alternatives !== 'null' && (
            <p className="mt-2 flex items-start gap-2 text-sm text-zinc-300"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{info.alternatives}</p>
          )}
        </div>
      ))}
    </div>
  )
}
