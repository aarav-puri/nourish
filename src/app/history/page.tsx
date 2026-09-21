'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Trash2, Calendar, Barcode, Package, Trash, Brain, ChevronDown, ChevronUp, Leaf, ArrowRightLeft, ChefHat, CheckSquare, type LucideIcon } from 'lucide-react'
import { auth, db } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import ChatAgent from '@/components/ChatAgent'
import { scoreFromGrade } from '@/components/product/ScoreMeter'
import InsightResults from '@/components/product/InsightResults'
import { toast } from 'sonner'
import Orb from '@/components/ui/Orb'

const INSIGHT_ICONS: Record<string, LucideIcon> = {
  alternatives: ArrowRightLeft,
  diet_compatibility: CheckSquare,
  eco_impact: Leaf,
  recipe_suggestions: ChefHat,
}

interface ScannedProduct {
  id: string
  barcode: string
  product_name: string
  product_data: any
  scanned_at: string
}

interface AIInsight {
  id: string
  barcode: string
  product_name: string
  insight_type: string
  insight_data: any
  created_at: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [products, setProducts] = useState<ScannedProduct[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [clearingAll, setClearingAll] = useState(false)

  useEffect(() => {
    checkAuthAndLoadHistory()
  }, [])

  const checkAuthAndLoadHistory = async () => {
    const user = await auth.getCurrentUser()
    if (!user) {
      toast.error('Please sign in to view your history')
      router.push('/')
      return
    }
    loadHistory()
  }

  const loadHistory = async () => {
    try {
      const [productsData, insightsData] = await Promise.all([
        db.getScannedProducts(),
        db.getAIInsights()
      ])
      setProducts(productsData || [])
      setInsights(insightsData || [])
    } catch (err: any) {
      toast.error('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item from history?')) return

    setDeleting(id)
    try {
      const product = products.find(p => p.id === id)
      if (product) {
        // Delete AI insights for this product first
        await db.deleteAIInsightsByBarcode(product.barcode)
        // Then delete the product
        await db.deleteScannedProduct(id)
        // Update UI
        setProducts(products.filter((p) => p.id !== id))
        setInsights(insights.filter((i) => i.barcode !== product.barcode))
        toast.success('Item deleted')
      }
    } catch (err) {
      toast.error('Failed to delete item')
    } finally {
      setDeleting(null)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all scan history? This action cannot be undone.')) return

    setClearingAll(true)
    try {
      // Delete all AI insights first
      await db.clearAllAIInsights()
      // Then delete all products
      await db.clearAllScannedProducts()
      // Update UI
      setProducts([])
      setInsights([])
      toast.success('All history cleared')
    } catch (err) {
      toast.error('Failed to clear history')
    } finally {
      setClearingAll(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getProductInsights = (barcode: string) => {
    return insights.filter(insight => insight.barcode === barcode)
  }

  const formatInsightType = (type: string) => {
    if (type === 'alternatives') return 'Healthier Alternatives'
    if (type === 'diet_compatibility') return 'Diet Compatibility'
    if (type === 'eco_impact') return 'Environmental Impact'
    if (type === 'recipe_suggestions') return 'Recipe Ideas'
    return type
  }

  const toggleProductExpansion = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId)
  }

  // Prepare context for AI chat agent
  const chatContext = useMemo(() => {
    return {
      products: products.map(p => ({
        name: p.product_name,
        barcode: p.barcode,
        scanned_at: p.scanned_at,
        ingredients: p.product_data?.ingredients_text,
        nutrition: p.product_data?.nutriments,
        categories: p.product_data?.categories,
      })),
      insights: insights.map(i => ({
        product_name: i.product_name,
        type: i.insight_type,
        data: i.insight_data?.content,
        created_at: i.created_at,
      })),
    }
  }, [products, insights])

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-card/95 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app" className="btn-ghost flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <h1 className="text-xl font-bold gradient-text">Scan History</h1>
          </div>
          {!loading && products.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearAll}
              disabled={clearingAll}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              {clearingAll ? (
                <Orb />
              ) : (
                <Trash className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Clear All</span>
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <Orb size={64} className="mx-auto mb-4 block" />
            <p className="text-zinc-400">Loading history...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No scanned products yet</h2>
            <p className="text-zinc-400 mb-6">Start scanning to build your history.</p>
            <Link href="/app">
              <Button>Start Scanning</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">{products.length} products scanned</p>

            <AnimatePresence>
              {products.map((product, i) => {
                const productInsights = getProductInsights(product.barcode)
                const isExpanded = expandedProduct === product.id

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: i * 0.05 }}
                    className="card"
                  >
                    <div className="flex items-start gap-4">
                      {/* No product photography anywhere in a result. A scan
                          returns a reading, so the tile carries the score
                          rather than a picture of the packet. */}
                      <div className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                        {(() => {
                          const score = scoreFromGrade(product.product_data?.nutriscore_grade)
                          return score === null ? (
                            <Package className="h-7 w-7 text-zinc-600" aria-hidden="true" />
                          ) : (
                            <>
                              <span className="tnum font-display text-2xl font-bold leading-none">
                                {score}
                              </span>
                              <span className="mt-1 text-[9px] font-bold uppercase tracking-label text-zinc-500">
                                / 100
                              </span>
                            </>
                          )
                        })()}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{product.product_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
                          <Barcode className="w-4 h-4" />
                          <span>{product.barcode}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(product.scanned_at)}</span>
                        </div>

                        {/* AI Insights Badge */}
                        {productInsights.length > 0 && (
                          <button
                            onClick={() => toggleProductExpansion(product.id)}
                            className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white"
                          >
                            <Brain className="w-4 h-4" aria-hidden="true" />
                            <span>{productInsights.length} AI Insight{productInsights.length > 1 ? 's' : ''}</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deleting === product.id}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        {deleting === product.id ? (
                          <Orb label="Deleting" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Expanded AI Insights */}
                    <AnimatePresence>
                      {isExpanded && productInsights.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                            {productInsights.map((insight) => (
                              <div
                                key={insight.id}
                                className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-5"
                              >
                                <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5">
                                      {(() => {
                                        const Icon = INSIGHT_ICONS[insight.insight_type] ?? Brain
                                        return <Icon className="h-4 w-4" aria-hidden="true" />
                                      })()}
                                    </span>
                                    <span className="truncate font-display text-sm font-semibold">
                                      {formatInsightType(insight.insight_type)}
                                    </span>
                                  </div>
                                  <span className="shrink-0 font-mono text-[11px] uppercase tracking-label text-zinc-500">
                                    {formatDate(insight.created_at)}
                                  </span>
                                </div>
                                {insight.insight_data?.content ? (
                                  <InsightResults content={insight.insight_data.content} />
                                ) : (
                                  <p className="text-sm text-zinc-400">No data available</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* AI Chat Agent */}
      {!loading && products.length > 0 && <ChatAgent context={chatContext} />}
    </div>
  )
}
