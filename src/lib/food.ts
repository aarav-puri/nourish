/**
 * The product model the whole interface reads from.
 *
 * Product records arrive in three shapes: a fresh lookup (Open Food Facts
 * fields, slimmed by /api/product), older history rows that stored the full
 * Open Food Facts record, and products typed in by hand. `toFood` folds all
 * three into one typed shape, so no component ever reads a raw record.
 *
 * Everything here is deterministic. Nutrient levels use the UK Food Standards
 * Agency front-of-pack thresholds; nothing is estimated unless the record
 * says it was.
 */

export type Grade = 'a' | 'b' | 'c' | 'd' | 'e'
export type Level = 'low' | 'moderate' | 'high'
export type Tri = 'yes' | 'no' | 'maybe' | null

export interface Nutrition {
  energyKcal?: number
  fat?: number
  saturatedFat?: number
  carbs?: number
  sugars?: number
  fiber?: number
  protein?: number
  salt?: number
}

export interface Food {
  barcode: string
  name: string
  brand?: string
  quantity?: string
  categories?: string
  ingredientsText?: string
  ingredients: string[]
  highlights: string[]
  grade: Grade | null
  /** The grade as a health score from 0 to 100, always inside its grade's band. */
  score: number | null
  gradeEstimated: boolean
  eco: Grade | null
  ecoEstimated: boolean
  nova: 1 | 2 | 3 | 4 | null
  additives: { code: string; name?: string }[]
  allergens: string[]
  traces: string[]
  vegan: Tri
  vegetarian: Tri
  palmOil: Tri
  labels: string[]
  packaging?: string
  countries?: string
  isBeverage: boolean
  nutrition: Nutrition
  levels: Partial<Record<'fat' | 'saturatedFat' | 'sugars' | 'salt', Level>>
  manual: boolean
}

const GRADES: Grade[] = ['a', 'b', 'c', 'd', 'e']

export const GRADE_INFO: Record<Grade, { label: string; summary: string }> = {
  a: { label: 'Excellent', summary: 'Among the best nutritional profiles in its kind.' },
  b: { label: 'Good', summary: 'A solid everyday choice.' },
  c: { label: 'Average', summary: 'Fine in moderation. Better options likely exist.' },
  d: { label: 'Poor', summary: 'Best as an occasional food.' },
  e: { label: 'Bad', summary: 'Weakest nutritional profile. Treat as a rare indulgence.' },
}

/** The share of the 0 to 100 score each grade covers. */
export const SCORE_BANDS: Record<Grade, [number, number]> = {
  a: [80, 100],
  b: [60, 79],
  c: [40, 59],
  d: [20, 39],
  e: [0, 19],
}

// Nutri-Score points per grade for solid foods (2023 method); fewer is better.
const POINT_BANDS: Record<Grade, [number, number]> = {
  a: [-17, 0],
  b: [1, 2],
  c: [3, 10],
  d: [11, 18],
  e: [19, 40],
}

/**
 * Places the raw Nutri-Score points on 0 to 100 within the grade's band, so
 * the number and the grade never disagree. Without points, the band's middle.
 */
export function scoreFor(grade: Grade | null, points?: number): number | null {
  if (!grade) return null
  const [lo, hi] = SCORE_BANDS[grade]
  if (points === undefined) return Math.round((lo + hi) / 2)
  const [best, worst] = POINT_BANDS[grade]
  const t = Math.min(1, Math.max(0, (points - best) / (worst - best)))
  return Math.round(hi - t * (hi - lo))
}

export const NOVA_INFO: Record<1 | 2 | 3 | 4, { label: string; detail: string }> = {
  1: { label: 'Unprocessed', detail: 'Whole or minimally processed food.' },
  2: { label: 'Culinary ingredient', detail: 'Oils, butter, sugar, salt and similar.' },
  3: { label: 'Processed', detail: 'Whole foods altered with salt, sugar or oil.' },
  4: { label: 'Ultra-processed', detail: 'Industrial formulation, usually with additives.' },
}

/* ---------- Allergens ---------------------------------------------------- */

export const ALLERGENS: { id: string; label: string }[] = [
  { id: 'gluten', label: 'Gluten' },
  { id: 'milk', label: 'Milk' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'peanuts', label: 'Peanuts' },
  { id: 'nuts', label: 'Tree nuts' },
  { id: 'soybeans', label: 'Soy' },
  { id: 'fish', label: 'Fish' },
  { id: 'crustaceans', label: 'Shellfish' },
  { id: 'molluscs', label: 'Molluscs' },
  { id: 'sesame-seeds', label: 'Sesame' },
  { id: 'celery', label: 'Celery' },
  { id: 'mustard', label: 'Mustard' },
  { id: 'lupin', label: 'Lupin' },
  { id: 'sulphur-dioxide-and-sulphites', label: 'Sulphites' },
]

const ALLERGEN_LABEL = Object.fromEntries(ALLERGENS.map((a) => [a.id, a.label]))

export function isKnownAllergen(id: string) {
  return id in ALLERGEN_LABEL
}

// Words in an ingredient list that reveal an allergen, for records with no
// declared allergens (hand-entered products, sparse database entries).
// Lookbehinds skip the usual false friends: cocoa butter, coconut milk.
const ALLERGEN_WORDS: Record<string, RegExp> = {
  gluten: /\b(wheat|barley|rye|spelt|semolina|gluten|malt|couscous|bulgur|durum)\b/i,
  milk: /\b((?<!(coconut|almond|oat|soy|soya|rice|cashew) )milk|buttermilk|cream|(?<!(cocoa|shea|peanut|nut|almond) )butter|cheese|whey|casein(ate)?|lactose|yogh?urt|ghee)\b/i,
  eggs: /\b(eggs?|albumen|albumin)\b/i,
  peanuts: /\b(peanuts?|groundnuts?)\b/i,
  nuts: /\b(almonds?|hazelnuts?|walnuts?|cashews?|pecans?|pistachios?|macadamias?|brazil nuts?)\b/i,
  soybeans: /\b(soy|soya|soybeans?|tofu)\b/i,
  fish: /\b(fish|anchov(y|ies)|tuna|salmon|cod|sardines?|mackerel)\b/i,
  crustaceans: /\b(shrimps?|prawns?|crabs?|lobsters?|crayfish)\b/i,
  molluscs: /\b(mussels?|oysters?|squid|clams?|scallops?|octopus)\b/i,
  'sesame-seeds': /\b(sesame|tahini)\b/i,
  celery: /\b(celery|celeriac)\b/i,
  mustard: /\bmustard\b/i,
  lupin: /\blupin\b/i,
  'sulphur-dioxide-and-sulphites': /\b(sulph|sulf)(ites?|ur dioxide)|metabisulphite/i,
}

/** Allergens named in ingredient text: what it contains, and what it "may contain". */
export function allergensInText(text?: string) {
  if (!text) return { contains: [] as string[], traces: [] as string[] }
  const split = text.search(/may contain|traces? of|produced in a factory|made in a factory/i)
  const main = split >= 0 ? text.slice(0, split) : text
  const trace = split >= 0 ? text.slice(split) : ''
  const ids = Object.keys(ALLERGEN_WORDS)
  return {
    contains: ids.filter((id) => ALLERGEN_WORDS[id].test(main)),
    traces: ids.filter((id) => ALLERGEN_WORDS[id].test(trace)),
  }
}

/* ---------- Additives ---------------------------------------------------- */

// The additives people most often meet on a label. Anything not listed is
// still shown, by its E number.
const ADDITIVE_NAMES: Record<string, string> = {
  e100: 'Curcumin', e101: 'Riboflavin', e102: 'Tartrazine', e104: 'Quinoline yellow',
  e110: 'Sunset yellow', e120: 'Carmine', e122: 'Azorubine', e124: 'Ponceau 4R',
  e129: 'Allura red', e133: 'Brilliant blue', e150a: 'Plain caramel', e150c: 'Ammonia caramel',
  e150d: 'Sulphite ammonia caramel', e160a: 'Carotenes', e160b: 'Annatto', e160c: 'Paprika extract',
  e162: 'Beetroot red', e170: 'Calcium carbonate', e171: 'Titanium dioxide',
  e200: 'Sorbic acid', e202: 'Potassium sorbate', e211: 'Sodium benzoate', e220: 'Sulphur dioxide',
  e223: 'Sodium metabisulphite', e250: 'Sodium nitrite', e252: 'Potassium nitrate',
  e260: 'Acetic acid', e270: 'Lactic acid', e282: 'Calcium propionate', e290: 'Carbon dioxide',
  e296: 'Malic acid', e300: 'Ascorbic acid', e301: 'Sodium ascorbate', e306: 'Tocopherols',
  e307: 'Alpha-tocopherol', e319: 'TBHQ', e320: 'BHA', e321: 'BHT', e322: 'Lecithins',
  e322i: 'Lecithin', e325: 'Sodium lactate', e330: 'Citric acid', e331: 'Sodium citrates',
  e332: 'Potassium citrates', e334: 'Tartaric acid', e338: 'Phosphoric acid',
  e339: 'Sodium phosphates', e340: 'Potassium phosphates', e341: 'Calcium phosphates',
  e385: 'Calcium disodium EDTA', e400: 'Alginic acid', e401: 'Sodium alginate', e407: 'Carrageenan',
  e410: 'Locust bean gum', e412: 'Guar gum', e414: 'Gum arabic', e415: 'Xanthan gum',
  e420: 'Sorbitol', e422: 'Glycerol', e440: 'Pectins', e450: 'Diphosphates',
  e451: 'Triphosphates', e452: 'Polyphosphates', e460: 'Cellulose', e466: 'Carboxymethyl cellulose',
  e471: 'Mono- and diglycerides', e472e: 'DATEM', e476: 'PGPR', e481: 'Sodium stearoyl lactylate',
  e500: 'Sodium carbonates', e501: 'Potassium carbonates', e503: 'Ammonium carbonates',
  e508: 'Potassium chloride', e621: 'Monosodium glutamate', e627: 'Disodium guanylate',
  e631: 'Disodium inosinate', e635: 'Disodium ribonucleotides', e900: 'Dimethylpolysiloxane',
  e903: 'Carnauba wax', e904: 'Shellac', e941: 'Nitrogen', e950: 'Acesulfame K',
  e951: 'Aspartame', e955: 'Sucralose', e960: 'Steviol glycosides', e965: 'Maltitol',
  e967: 'Xylitol', e1400: 'Dextrin', e1422: 'Acetylated distarch adipate', e1442: 'Hydroxypropyl distarch phosphate',
}

/* ---------- Helpers ------------------------------------------------------ */

function num(...values: unknown[]): number | undefined {
  for (const v of values) {
    if (v === null || v === undefined || v === '') continue
    const n = typeof v === 'number' ? v : Number(v)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function asGrade(value: unknown): Grade | null {
  const g = typeof value === 'string' ? value.toLowerCase() : ''
  return (GRADES as string[]).includes(g) ? (g as Grade) : null
}

function stripTag(tag: string) {
  return tag.replace(/^[a-z]{2}:/, '')
}

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Splits an ingredient list on top-level commas, leaving bracketed sub-lists intact. */
export function splitIngredients(text?: string): string[] {
  if (!text) return []
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of text.replace(/\s+/g, ' ')) {
    if (ch === '(' || ch === '[') depth++
    if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1)
    if ((ch === ',' || ch === ';') && depth === 0) {
      if (cur.trim()) out.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  if (cur.trim()) out.push(cur.trim().replace(/\.$/, ''))
  return out.map((s) => s.replace(/_/g, '')).filter(Boolean)
}

function tri(tags: string[], yes: string, no: string, maybe: string): Tri {
  if (tags.includes(no)) return 'no'
  if (tags.includes(maybe)) return 'maybe'
  if (tags.includes(yes)) return 'yes'
  return null
}

/* ---------- Nutrient levels (FSA front-of-pack, per 100g / 100ml) -------- */

const THRESHOLDS = {
  food: { fat: [3, 17.5], saturatedFat: [1.5, 5], sugars: [5, 22.5], salt: [0.3, 1.5] },
  drink: { fat: [1.5, 8.75], saturatedFat: [0.75, 2.5], sugars: [2.5, 11.25], salt: [0.3, 0.75] },
} as const

export function levelFor(
  key: keyof (typeof THRESHOLDS)['food'],
  value: number | undefined,
  isBeverage: boolean
): Level | undefined {
  if (value === undefined) return undefined
  const [low, high] = THRESHOLDS[isBeverage ? 'drink' : 'food'][key]
  if (value <= low) return 'low'
  if (value > high) return 'high'
  return 'moderate'
}

/* ---------- Normalisation ----------------------------------------------- */

export function toFood(raw: any, barcodeHint = ''): Food {
  const p = raw ?? {}
  const n = p.nutriments ?? {}
  const ai = p.ai_formatted ?? {}

  const categoryTags: string[] = Array.isArray(p.categories_tags) ? p.categories_tags : []
  const categories: string = p.categories ?? ''
  const isBeverage =
    categoryTags.some((t) => /:(beverages|drinks|waters|sodas|juices)/.test(t)) ||
    /\b(beverage|drink|soda|juice|water)s?\b/i.test(categories)

  // Energy: prefer the explicit kcal field; convert kJ when that is all there is.
  const energyUnit = String(n.energy_unit ?? n['energy_unit'] ?? '').toLowerCase()
  const energyKcal = num(
    n['energy-kcal_100g'],
    n['energy-kcal'],
    energyUnit === 'kcal' || p.manual ? n.energy_value : undefined,
    n.energy_value !== undefined && energyUnit === 'kj' ? Number(n.energy_value) / 4.184 : undefined,
    n.energy_100g !== undefined ? Number(n.energy_100g) / 4.184 : undefined
  )

  const nutrition: Nutrition = {
    energyKcal: energyKcal !== undefined ? Math.round(energyKcal) : undefined,
    fat: num(n.fat_100g, n.fat),
    saturatedFat: num(n['saturated-fat_100g'], n['saturated-fat']),
    carbs: num(n.carbohydrates_100g, n.carbohydrates),
    sugars: num(n.sugars_100g, n.sugars),
    fiber: num(n.fiber_100g, n.fiber),
    protein: num(n.proteins_100g, n.proteins),
    salt: num(n.salt_100g, n.salt, n.sodium_100g !== undefined ? Number(n.sodium_100g) * 2.5 : undefined),
  }

  const levels: Food['levels'] = {}
  for (const key of ['fat', 'saturatedFat', 'sugars', 'salt'] as const) {
    const l = levelFor(key, nutrition[key], isBeverage)
    if (l) levels[key] = l
  }

  const analysis: string[] = Array.isArray(p.ingredients_analysis_tags) ? p.ingredients_analysis_tags : []
  const estimated: string[] = Array.isArray(p.ai_estimated_scores) ? p.ai_estimated_scores : []

  const additives = (Array.isArray(p.additives_tags) ? p.additives_tags : [])
    .map((t: string) => stripTag(t).toLowerCase())
    // Drop duplicates, and sub-variants such as e322i when the parent e322 is listed.
    .filter((code: string, i: number, all: string[]) => {
      const base = code.replace(/[a-z]+$/, '')
      return all.indexOf(code) === i && (base === code || !all.includes(base))
    })
    .map((code: string) => ({
      code: code.toUpperCase(),
      name: ADDITIVE_NAMES[code] ?? ADDITIVE_NAMES[code.replace(/[a-z]+$/, '')],
    }))

  const tagLabels = (tags: unknown) =>
    (Array.isArray(tags) ? tags : [])
      .map((t: string) => stripTag(t))
      .filter((t: string, i: number, all: string[]) => t && all.indexOf(t) === i)

  const ingredientsText: string | undefined = ai.formatted_ingredients || p.ingredients_text || undefined
  const nova = num(p.nova_group)

  // Declared allergens, plus any the ingredient text names: a record missing
  // its allergen tags must never read as allergen-free.
  const fromText = allergensInText(p.ingredients_text || ingredientsText)
  const allergens = Array.from(new Set([...tagLabels(p.allergens_tags), ...fromText.contains]))
  const traces = Array.from(new Set([...tagLabels(p.traces_tags), ...fromText.traces])).filter((t) => !allergens.includes(t))

  return {
    barcode: String(p.code ?? p.barcode ?? barcodeHint ?? ''),
    name: ai.formatted_name || p.product_name || p.product_name_en || 'Unnamed product',
    brand: ai.formatted_brand || (p.brands ? String(p.brands).split(',')[0].trim() : undefined),
    // Drop the ℮ "estimated quantity" mark, which often arrives as a bare "e".
    quantity: p.quantity ? String(p.quantity).replace(/\s*(℮|\be)\s*$/, '').trim() || undefined : undefined,
    categories: categories || undefined,
    ingredientsText,
    ingredients: splitIngredients(ingredientsText),
    highlights: Array.isArray(ai.key_highlights) ? ai.key_highlights.filter(Boolean) : [],
    grade: asGrade(p.nutriscore_grade),
    score: scoreFor(asGrade(p.nutriscore_grade), estimated.includes('nutriscore_grade') ? undefined : num(p.nutriscore_score)),
    gradeEstimated: estimated.includes('nutriscore_grade'),
    eco: asGrade(p.ecoscore_grade),
    ecoEstimated: estimated.includes('ecoscore_grade'),
    nova: nova && nova >= 1 && nova <= 4 ? (Math.round(nova) as 1 | 2 | 3 | 4) : null,
    additives,
    allergens,
    traces,
    vegan: tri(analysis, 'en:vegan', 'en:non-vegan', 'en:maybe-vegan'),
    vegetarian: tri(analysis, 'en:vegetarian', 'en:non-vegetarian', 'en:maybe-vegetarian'),
    palmOil: tri(analysis, 'en:palm-oil-free', 'en:palm-oil', 'en:may-contain-palm-oil'),
    labels: tagLabels(p.labels_tags),
    packaging: p.packaging || undefined,
    countries: p.countries || undefined,
    isBeverage,
    nutrition,
    levels,
    manual: Boolean(p.manual),
  }
}

export function allergenLabel(id: string) {
  return ALLERGEN_LABEL[id] ?? titleCase(id.replace(/-/g, ' '))
}

/* ---------- Reading the label: strengths and concerns ------------------- */

export interface Point {
  tone: 'good' | 'bad'
  text: string
}

/** The handful of facts that explain a grade, worst first. */
export function keyPoints(food: Food): Point[] {
  const bad: Point[] = []
  const good: Point[] = []
  const { nutrition: n, levels } = food
  const unit = food.isBeverage ? '100ml' : '100g'

  if (levels.sugars === 'high') bad.push({ tone: 'bad', text: `High in sugar, ${fmt(n.sugars)}g per ${unit}` })
  if (levels.saturatedFat === 'high')
    bad.push({ tone: 'bad', text: `High in saturated fat, ${fmt(n.saturatedFat)}g per ${unit}` })
  if (levels.salt === 'high') bad.push({ tone: 'bad', text: `High in salt, ${fmt(n.salt, 2)}g per ${unit}` })
  if (food.nova === 4) bad.push({ tone: 'bad', text: 'Ultra-processed' })
  if (food.additives.length >= 5) bad.push({ tone: 'bad', text: `${food.additives.length} additives` })
  if (levels.fat === 'high' && levels.saturatedFat !== 'high')
    bad.push({ tone: 'bad', text: `High in fat, ${fmt(n.fat)}g per ${unit}` })

  if (n.fiber !== undefined && n.fiber >= 6) good.push({ tone: 'good', text: `High in fiber, ${fmt(n.fiber)}g` })
  else if (n.fiber !== undefined && n.fiber >= 3) good.push({ tone: 'good', text: `Source of fiber, ${fmt(n.fiber)}g` })
  if (n.protein !== undefined && n.protein >= 12) good.push({ tone: 'good', text: `High in protein, ${fmt(n.protein)}g` })
  if (levels.sugars === 'low') good.push({ tone: 'good', text: 'Low in sugar' })
  if (levels.salt === 'low') good.push({ tone: 'good', text: 'Low in salt' })
  if (levels.saturatedFat === 'low') good.push({ tone: 'good', text: 'Low in saturated fat' })
  if (food.nova === 1) good.push({ tone: 'good', text: 'Unprocessed' })
  if (food.additives.length === 0 && food.ingredients.length > 0 && !food.manual)
    good.push({ tone: 'good', text: 'No additives' })

  return [...bad.slice(0, 4), ...good.slice(0, 4)]
}

export function fmt(value: number | undefined, digits = 1) {
  if (value === undefined) return '–'
  const fixed = value.toFixed(digits)
  return fixed.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

/** Ingredients a quick text search can tie to a diet, used when the database has no analysis. */
const MEAT_FISH = /\b(beef|pork|chicken|turkey|lamb|mutton|veal|bacon|ham|lard|tallow|gelatine?|anchov(y|ies)|fish|tuna|salmon|shrimp|prawn|crab|lobster|carmine|cochineal|rennet|chorizo|salami|pepperoni|meat)\b/i
const ANIMAL_PRODUCT = /\b((?<!(coconut|almond|oat|soy|soya|rice|cashew) )milk|buttermilk|whey|casein|caseinate|lactose|(?<!(cocoa|shea|peanut|nut|almond) )butter|cream|cheese|yogh?urt|eggs?|honey|beeswax|ghee|albumin)\b/i
const NOT_PALEO = /\b(wheat|barley|rye|oats?|rice|corn|maize|flour|bread|pasta|beans?|lentils?|chickpeas?|peas|soy|soya|peanuts?|(?<!(coconut|almond|cashew) )milk|cheese|yogh?urt|cream|whey|sugar|glucose|fructose|dextrose|syrup)\b/i
const NOT_HALAL = /\b(pork|bacon|ham|lard|gelatine?|wine|rum|beer|alcohol|ethanol|chorizo|salami|pepperoni)\b/i

export { MEAT_FISH, ANIMAL_PRODUCT, NOT_HALAL, NOT_PALEO }
