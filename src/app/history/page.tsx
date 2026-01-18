'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Trash2, Calendar, Barcode, Loader2, Package, Trash } from 'lucide-react'
import { auth, db } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { toast } from 'sonner'

interface ScannedProduct {
  id: string
  barcode: string
  product_name: string
  product_data: any
  scanned_at: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [products, setProducts] = useState<ScannedProduct[]>([])
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
      const data = await db.getScannedProducts()
      setProducts(data || [])
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
      await db.deleteScannedProduct(id)
      setProducts(products.filter((p) => p.id !== id))
      toast.success('Item deleted')
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
      await db.clearAllScannedProducts()
      setProducts([])
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
                <Loader2 className="w-4 h-4 animate-spin" />
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
            <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
            <p className="text-zinc-400">Loading history...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No scanned products yet</h2>
            <p className="text-zinc-400 mb-6">Start scanning to build your history!</p>
            <Link href="/app">
              <Button>Start Scanning</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">{products.length} products scanned</p>
            
            <AnimatePresence>
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.05 }}
                  className="card flex items-start gap-4"
                >
                  {/* Product Image */}
                  {product.product_data?.image_url ? (
                    <img
                      src={product.product_data.image_url}
                      alt={product.product_name}
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <Package className="w-8 h-8 text-zinc-600" />
                    </div>
                  )}

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
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deleting === product.id}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    {deleting === product.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}
