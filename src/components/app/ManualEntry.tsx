'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { db } from '@/lib/supabase'
import { scoreProduct } from '@/lib/product-api'
import { toFood, type Food } from '@/lib/food'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const NUTRIENTS = [
  { key: 'energy-kcal_100g', label: 'Energy', unit: 'kcal' },
  { key: 'fat_100g', label: 'Fat', unit: 'g' },
  { key: 'saturated-fat_100g', label: 'Saturated fat', unit: 'g' },
  { key: 'carbohydrates_100g', label: 'Carbohydrate', unit: 'g' },
  { key: 'sugars_100g', label: 'Total sugars', unit: 'g' },
  { key: 'fiber_100g', label: 'Fiber', unit: 'g' },
  { key: 'proteins_100g', label: 'Protein', unit: 'g' },
  { key: 'salt_100g', label: 'Salt', unit: 'g' },
] as const

/**
 * For products the databases do not know: copy the label in, and Nourish
 * analyzes it the same way. Fields follow the order of a printed label so
 * the eye can run down the package and the form together.
 */
export default function ManualEntry({ barcode, onDone }: { barcode: string; onDone: (food: Food) => void }) {
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [nutrients, setNutrients] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<{ name?: string; ingredients?: string }>({})
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Enter the product name.'
    if (!ingredients.trim()) next.ingredients = 'Copy the ingredients from the package.'
    setErrors(next)
    if (Object.keys(next).length) return

    const nutriments: Record<string, number> = {}
    for (const n of NUTRIENTS) {
      const v = parseFloat((nutrients[n.key] ?? '').replace(',', '.'))
      if (Number.isFinite(v) && v >= 0) nutriments[n.key] = v
    }

    const raw: Record<string, any> = {
      code: barcode,
      product_name: name.trim(),
      brands: brand.trim() || undefined,
      ingredients_text: ingredients.trim(),
      nutriments,
      manual: true,
    }

    setBusy(true)
    try {
      Object.assign(raw, await scoreProduct(raw))
    } catch {
      toast('Saved without a grade', { description: 'We could not estimate one just now.' })
    }
    const food = toFood(raw, barcode)
    db.saveScannedProduct(barcode, food.name, raw).catch(() => {})
    setBusy(false)
    onDone(food)
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="t-title">Enter it from the package</h1>
      <p className="mt-2 leading-relaxed text-ink-2">
        Copy what is printed on the label. Nourish grades it, checks it against your profile, and keeps it in your history.
        {barcode && (
          <>
            {' '}
            Barcode <span className="font-mono text-ink">{barcode}</span>.
          </>
        )}
      </p>

      <form onSubmit={submit} noValidate className="card mt-6 space-y-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Product name" required value={name} onChange={(e) => setName(e.target.value)} error={errors.name} placeholder="Oat & honey granola" />
          <Input label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Optional" />
        </div>

        <div>
          <label htmlFor="ingredients" className="label">
            Ingredients
            <span className="sr-only"> (required)</span>
          </label>
          <textarea
            id="ingredients"
            rows={4}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            aria-invalid={errors.ingredients ? true : undefined}
            aria-describedby="ingredients-help"
            placeholder="Whole grain oats (54%), honey, sunflower oil, almonds…"
            className="field min-h-[6.5rem] resize-y leading-relaxed"
          />
          {errors.ingredients ? (
            <p id="ingredients-help" role="alert" className="mt-1.5 text-xs font-medium text-level-high">
              {errors.ingredients}
            </p>
          ) : (
            <p id="ingredients-help" className="mt-1.5 text-xs text-ink-3">
              Separated by commas, exactly as printed.
            </p>
          )}
        </div>

        <fieldset>
          <legend className="label">
            Nutrition per 100g <span className="font-normal text-ink-3">(optional, but it makes the grade possible)</span>
          </legend>
          <div className="well mt-1 px-1">
            {NUTRIENTS.map((n) => {
              const sub = n.key === 'saturated-fat_100g' || n.key === 'sugars_100g'
              return (
                <label key={n.key} className="flex items-center justify-between gap-3 border-b border-line px-3 py-1.5 last:border-b-0">
                  <span className={`text-sm ${sub ? 'pl-3 text-ink-2' : 'font-medium'}`}>{n.label}</span>
                  <span className="flex items-center gap-2">
                    <input
                      inputMode="decimal"
                      value={nutrients[n.key] ?? ''}
                      onChange={(e) => setNutrients((s) => ({ ...s, [n.key]: e.target.value.replace(/[^\d.,]/g, '') }))}
                      className="h-9 w-20 rounded-lg bg-paper px-2 text-right font-mono text-sm shadow-neu-sm focus:outline-none focus:ring-2 focus:ring-ink/40"
                      aria-label={`${n.label} in ${n.unit}`}
                      placeholder="–"
                    />
                    <span className="w-8 font-mono text-xs text-ink-3">{n.unit}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <Button type="submit" size="lg" loading={busy} className="w-full">
          {busy ? 'Analyzing' : 'Analyze this product'}
        </Button>
      </form>
    </div>
  )
}
