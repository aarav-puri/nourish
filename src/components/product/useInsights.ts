'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { db } from '@/lib/supabase'
import { AIError, aiService, INSIGHT_TITLES, type InsightKind } from '@/lib/ai-service'
import type { Food } from '@/lib/food'

export interface SavedInsight {
  id?: string
  kind: InsightKind
  content: any
  createdAt: string
  /** For diet checks: which diets this answer covers. */
  diets?: string[]
}

/**
 * AI insights for one product. Answers already generated for this barcode are
 * loaded from history, so opening one again is instant and costs nothing;
 * new ones are generated on the person's own key and saved.
 */
export function useInsights(food: Food | null) {
  const [saved, setSaved] = useState<Partial<Record<InsightKind, SavedInsight>>>({})
  const [running, setRunning] = useState<InsightKind | null>(null)
  const [open, setOpen] = useState<SavedInsight | null>(null)
  const barcode = food?.barcode

  useEffect(() => {
    setSaved({})
    setOpen(null)
    if (!barcode) return
    let cancelled = false
    db.getAIInsights(barcode, 20)
      .then((rows) => {
        if (cancelled || !rows) return
        const latest: Partial<Record<InsightKind, SavedInsight>> = {}
        // Rows arrive newest first, so the first of each kind wins.
        for (const row of rows) {
          const kind = row.insight_type as InsightKind
          if (!INSIGHT_TITLES[kind] || latest[kind] || !row.insight_data?.content) continue
          latest[kind] = {
            id: row.id,
            kind,
            content: row.insight_data.content,
            createdAt: row.created_at,
            diets: row.insight_data.diets,
          }
        }
        setSaved(latest)
      })
      .catch(() => {
        /* history is a convenience here; a failed read just means no cache */
      })
    return () => {
      cancelled = true
    }
  }, [barcode])

  const run = useCallback(
    async (kind: InsightKind, opts: { diets?: string[]; fresh?: boolean } = {}) => {
      if (!food) return
      const cached = saved[kind]
      const sameDiets =
        kind !== 'diet_compatibility' ||
        (cached?.diets && opts.diets && [...cached.diets].sort().join() === [...opts.diets].sort().join())
      if (cached && !opts.fresh && sameDiets) {
        setOpen(cached)
        return
      }

      setRunning(kind)
      try {
        let content: any
        switch (kind) {
          case 'alternatives':
            content = await aiService.getHealthierSubstitutes(food, opts.diets)
            break
          case 'recipe_suggestions':
            content = await aiService.getRecipeSuggestions(food, opts.diets)
            break
          case 'eco_impact':
            content = await aiService.analyzeEcoImpact(food)
            break
          case 'diet_compatibility':
            content = await aiService.analyzeDietCompatibility(food, opts.diets ?? [])
            break
        }

        const insight: SavedInsight = { kind, content, createdAt: new Date().toISOString(), diets: opts.diets }
        setSaved((s) => ({ ...s, [kind]: insight }))
        setOpen(insight)

        db.saveAIInsight(food.barcode, food.name, kind, {
          title: INSIGHT_TITLES[kind],
          content,
          diets: opts.diets,
        }).catch(() => {
          /* the answer is on screen either way */
        })
      } catch (err) {
        toast.error(err instanceof AIError ? err.message : 'The AI did not respond. Try again.')
      } finally {
        setRunning(null)
      }
    },
    [food, saved]
  )

  return { saved, running, open, setOpen, run }
}
