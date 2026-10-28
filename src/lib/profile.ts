import {
  ANIMAL_PRODUCT,
  MEAT_FISH,
  NOT_HALAL,
  NOT_PALEO,
  allergenLabel,
  fmt,
  isKnownAllergen,
  type Food,
} from '@/lib/food'

/**
 * A person's food profile: the diets they follow and the allergens they
 * avoid. It lives in Supabase auth user metadata, so it follows the account
 * to every device without a schema change. Both lists hold known ids or,
 * for anything typed in, the person's own words.
 */
export interface FoodProfile {
  diets: string[]
  avoid: string[]
}

export type DietId =
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'gluten-free'
  | 'dairy-free'
  | 'halal'
  | 'kosher'
  | 'keto'
  | 'low-sugar'
  | 'low-salt'
  | 'mediterranean'
  | 'paleo'
  | 'low-carb'
  | 'high-protein'
  | 'low-fat'

export type DietGroup = 'style' | 'goal' | 'need'

export const DIET_GROUPS: { id: DietGroup; label: string }[] = [
  { id: 'style', label: 'Eating styles' },
  { id: 'goal', label: 'Health goals' },
  { id: 'need', label: 'Faith and intolerances' },
]

// The most followed eating patterns in U.S. surveys (IFIC Food & Health),
// limited to ones a label can actually be checked against.
export const DIETS: { id: DietId; label: string; hint: string; group: DietGroup }[] = [
  { id: 'vegetarian', label: 'Vegetarian', hint: 'No meat or fish', group: 'style' },
  { id: 'vegan', label: 'Vegan', hint: 'No animal products', group: 'style' },
  { id: 'pescatarian', label: 'Pescatarian', hint: 'Fish, no meat', group: 'style' },
  { id: 'mediterranean', label: 'Mediterranean', hint: 'Whole foods, olive oil', group: 'style' },
  { id: 'paleo', label: 'Paleo', hint: 'No grains, dairy or legumes', group: 'style' },
  { id: 'keto', label: 'Keto', hint: 'Very low carbohydrate', group: 'style' },
  { id: 'high-protein', label: 'High protein', hint: 'Favors protein-rich foods', group: 'goal' },
  { id: 'low-carb', label: 'Low carb', hint: 'Fewer carbohydrates', group: 'goal' },
  { id: 'low-sugar', label: 'Low sugar', hint: 'Flags high-sugar foods', group: 'goal' },
  { id: 'low-salt', label: 'Low salt', hint: 'Flags high-salt foods', group: 'goal' },
  { id: 'low-fat', label: 'Low fat', hint: 'Flags high-fat foods', group: 'goal' },
  { id: 'gluten-free', label: 'Gluten-free', hint: 'No wheat, barley or rye', group: 'need' },
  { id: 'dairy-free', label: 'Dairy-free', hint: 'No milk products', group: 'need' },
  { id: 'halal', label: 'Halal', hint: 'No pork or alcohol', group: 'need' },
  { id: 'kosher', label: 'Kosher', hint: 'Certified kosher', group: 'need' },
]

/** Longest custom diet or allergen a person can type, and how many they can keep. */
export const MAX_ENTRY_LENGTH = 40
const MAX_ENTRIES = 30

const cleanList = (raw: unknown) =>
  Array.isArray(raw)
    ? [...new Set(raw.filter((x): x is string => typeof x === 'string').map((x) => x.trim().slice(0, MAX_ENTRY_LENGTH)).filter(Boolean))].slice(0, MAX_ENTRIES)
    : []

export const EMPTY_PROFILE: FoodProfile = { diets: [], avoid: [] }

export function readProfile(user: any): FoodProfile {
  const raw = user?.user_metadata?.food_profile
  if (!raw || typeof raw !== 'object') return EMPTY_PROFILE
  return { diets: cleanList(raw.diets), avoid: cleanList(raw.avoid) }
}

/**
 * Whether this account has been through first-run onboarding. Accounts from
 * before the flag existed count as done once they have saved a profile.
 */
export function isOnboarded(user: any) {
  const meta = user?.user_metadata
  return meta?.onboarded === true || (meta?.food_profile && typeof meta.food_profile === 'object')
}

export function isProfileEmpty(p: FoodProfile) {
  return p.diets.length === 0 && p.avoid.length === 0
}

export function dietLabel(id: string) {
  return DIETS.find((d) => d.id === id)?.label ?? id
}

export function isKnownDiet(id: string) {
  return DIETS.some((d) => d.id === id)
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/* ---------- Checking a product against a profile ------------------------- */

export type CheckStatus = 'conflict' | 'caution' | 'ok' | 'unknown'

export interface Check {
  key: string
  status: CheckStatus
  title: string
  detail?: string
}

const ORDER: Record<CheckStatus, number> = { conflict: 0, caution: 1, unknown: 2, ok: 3 }

function ingredientMatch(food: Food, pattern: RegExp) {
  const m = food.ingredientsText?.match(pattern)
  return m ? m[0].toLowerCase() : null
}

/**
 * Compares a product to the profile using only what the record states:
 * declared allergens and traces, the database's ingredient analysis, nutrient
 * levels, certification labels and, as a fallback, the ingredient text.
 * When the record cannot settle a question the answer is "unknown", never a
 * guess.
 */
export function checkProduct(food: Food, profile: FoodProfile): Check[] {
  const checks: Check[] = []
  const hasIngredients = food.ingredients.length > 0
  const has = (id: string) => food.allergens.includes(id)
  const mayHave = (id: string) => food.traces.includes(id)

  for (const id of profile.avoid) {
    const label = allergenLabel(id)
    if (!isKnownAllergen(id)) {
      // Typed in by the person: only the ingredient text can answer, singular or plural.
      const hit = ingredientMatch(food, new RegExp(`\\b${escapeRegExp(id)}(e?s)?\\b`, 'i'))
      if (hit) checks.push({ key: `a-${id}`, status: 'conflict', title: `Contains ${label.toLowerCase()}` })
      else if (hasIngredients) checks.push({ key: `a-${id}`, status: 'ok', title: `No ${label.toLowerCase()} in the ingredients` })
      else checks.push({ key: `a-${id}`, status: 'unknown', title: `${label}: no ingredient list` })
      continue
    }
    if (has(id)) checks.push({ key: `a-${id}`, status: 'conflict', title: `Contains ${label.toLowerCase()}` })
    else if (mayHave(id))
      checks.push({ key: `a-${id}`, status: 'caution', title: `May contain ${label.toLowerCase()}`, detail: 'Listed as a trace' })
    else if (food.allergens.length > 0 || hasIngredients)
      checks.push({ key: `a-${id}`, status: 'ok', title: `No ${label.toLowerCase()} declared` })
    else checks.push({ key: `a-${id}`, status: 'unknown', title: `${label}: no allergen data` })
  }

  for (const diet of profile.diets) {
    switch (diet as DietId) {
      case 'vegan': {
        const hit = ingredientMatch(food, MEAT_FISH) ?? ingredientMatch(food, ANIMAL_PRODUCT)
        if (food.vegan === 'no' || has('milk') || has('eggs') || has('fish') || has('crustaceans'))
          checks.push({ key: diet, status: 'conflict', title: 'Not vegan', detail: hit ? `Contains ${hit}` : undefined })
        else if (food.vegan === 'maybe')
          checks.push({ key: diet, status: 'caution', title: 'May not be vegan', detail: 'Some ingredients are unclear' })
        else if (food.vegan === 'yes') checks.push({ key: diet, status: 'ok', title: 'Vegan' })
        else if (hit) checks.push({ key: diet, status: 'conflict', title: 'Not vegan', detail: `Contains ${hit}` })
        else checks.push({ key: diet, status: hasIngredients ? 'ok' : 'unknown', title: hasIngredients ? 'Looks vegan' : 'Vegan: not enough data' })
        break
      }
      case 'vegetarian':
      case 'pescatarian': {
        const label = diet === 'vegetarian' ? 'vegetarian' : 'pescatarian'
        const fishOk = diet === 'pescatarian'
        const raw = ingredientMatch(food, MEAT_FISH)
        const hit = raw && fishOk && /fish|tuna|salmon|anchov|shrimp|prawn|crab|lobster/.test(raw) ? null : raw
        if ((food.vegetarian === 'no' && !fishOk) || hit)
          checks.push({ key: diet, status: 'conflict', title: `Not ${label}`, detail: hit ? `Contains ${hit}` : undefined })
        else if (food.vegetarian === 'maybe')
          checks.push({ key: diet, status: 'caution', title: `May not be ${label}`, detail: 'Some ingredients are unclear' })
        else if (food.vegetarian === 'yes' || hasIngredients)
          checks.push({ key: diet, status: 'ok', title: food.vegetarian === 'yes' ? dietLabel(diet) : `Looks ${label}` })
        else checks.push({ key: diet, status: 'unknown', title: `${dietLabel(diet)}: not enough data` })
        break
      }
      case 'gluten-free':
        if (food.labels.includes('no-gluten') || food.labels.includes('gluten-free'))
          checks.push({ key: diet, status: 'ok', title: 'Certified gluten-free' })
        else if (has('gluten')) checks.push({ key: diet, status: 'conflict', title: 'Contains gluten' })
        else if (mayHave('gluten')) checks.push({ key: diet, status: 'caution', title: 'May contain gluten' })
        else checks.push({ key: diet, status: hasIngredients ? 'ok' : 'unknown', title: hasIngredients ? 'No gluten declared' : 'Gluten: no data' })
        break
      case 'dairy-free':
        if (has('milk')) checks.push({ key: diet, status: 'conflict', title: 'Contains milk' })
        else if (mayHave('milk')) checks.push({ key: diet, status: 'caution', title: 'May contain milk' })
        else checks.push({ key: diet, status: hasIngredients ? 'ok' : 'unknown', title: hasIngredients ? 'No dairy declared' : 'Dairy: no data' })
        break
      case 'halal': {
        const hit = ingredientMatch(food, NOT_HALAL)
        if (food.labels.includes('halal')) checks.push({ key: diet, status: 'ok', title: 'Certified halal' })
        else if (hit) checks.push({ key: diet, status: 'conflict', title: 'May not be halal', detail: `Contains ${hit}` })
        else checks.push({ key: diet, status: 'unknown', title: 'Not certified halal', detail: 'No obvious conflicts in the ingredients' })
        break
      }
      case 'kosher':
        if (food.labels.some((l) => l.includes('kosher'))) checks.push({ key: diet, status: 'ok', title: 'Certified kosher' })
        else checks.push({ key: diet, status: 'unknown', title: 'No kosher certification listed' })
        break
      case 'keto': {
        const c = food.nutrition.carbs
        if (c === undefined) checks.push({ key: diet, status: 'unknown', title: 'Keto: no carb data' })
        else if (c > 10) checks.push({ key: diet, status: 'conflict', title: 'Too many carbs for keto', detail: `${fmt(c)}g per 100g` })
        else if (c > 5) checks.push({ key: diet, status: 'caution', title: 'Moderate carbs', detail: `${fmt(c)}g per 100g` })
        else checks.push({ key: diet, status: 'ok', title: 'Keto friendly', detail: `${fmt(c)}g carbs per 100g` })
        break
      }
      case 'low-sugar': {
        const l = food.levels.sugars
        if (!l) checks.push({ key: diet, status: 'unknown', title: 'Sugar: no data' })
        else if (l === 'high') checks.push({ key: diet, status: 'conflict', title: 'High in sugar', detail: `${fmt(food.nutrition.sugars)}g per 100g` })
        else if (l === 'moderate') checks.push({ key: diet, status: 'caution', title: 'Moderate sugar', detail: `${fmt(food.nutrition.sugars)}g per 100g` })
        else checks.push({ key: diet, status: 'ok', title: 'Low in sugar' })
        break
      }
      case 'low-salt': {
        const l = food.levels.salt
        if (!l) checks.push({ key: diet, status: 'unknown', title: 'Salt: no data' })
        else if (l === 'high') checks.push({ key: diet, status: 'conflict', title: 'High in salt', detail: `${fmt(food.nutrition.salt, 2)}g per 100g` })
        else if (l === 'moderate') checks.push({ key: diet, status: 'caution', title: 'Moderate salt', detail: `${fmt(food.nutrition.salt, 2)}g per 100g` })
        else checks.push({ key: diet, status: 'ok', title: 'Low in salt' })
        break
      }
      case 'low-fat': {
        const l = food.levels.fat
        if (!l) checks.push({ key: diet, status: 'unknown', title: 'Fat: no data' })
        else if (l === 'high') checks.push({ key: diet, status: 'conflict', title: 'High in fat', detail: `${fmt(food.nutrition.fat)}g per 100g` })
        else if (l === 'moderate') checks.push({ key: diet, status: 'caution', title: 'Moderate fat', detail: `${fmt(food.nutrition.fat)}g per 100g` })
        else checks.push({ key: diet, status: 'ok', title: 'Low in fat' })
        break
      }
      case 'low-carb': {
        const c = food.nutrition.carbs
        if (c === undefined) checks.push({ key: diet, status: 'unknown', title: 'Low carb: no carb data' })
        else if (c > 22.5) checks.push({ key: diet, status: 'conflict', title: 'High in carbs', detail: `${fmt(c)}g per 100g` })
        else if (c > 10) checks.push({ key: diet, status: 'caution', title: 'Moderate carbs', detail: `${fmt(c)}g per 100g` })
        else checks.push({ key: diet, status: 'ok', title: 'Low in carbs', detail: `${fmt(c)}g per 100g` })
        break
      }
      case 'high-protein': {
        const p = food.nutrition.protein
        if (p === undefined) checks.push({ key: diet, status: 'unknown', title: 'Protein: no data' })
        else if (p >= 10) checks.push({ key: diet, status: 'ok', title: 'High in protein', detail: `${fmt(p)}g per 100g` })
        else checks.push({ key: diet, status: 'caution', title: 'Not a strong protein source', detail: `${fmt(p)}g per 100g` })
        break
      }
      case 'paleo': {
        const hit = ingredientMatch(food, NOT_PALEO)
        if (hit || has('milk') || has('gluten') || has('peanuts') || has('soybeans'))
          checks.push({ key: diet, status: 'conflict', title: 'Not paleo', detail: hit ? `Contains ${hit}` : undefined })
        else checks.push({ key: diet, status: hasIngredients ? 'ok' : 'unknown', title: hasIngredients ? 'Looks paleo' : 'Paleo: not enough data' })
        break
      }
      case 'mediterranean':
        if (food.nova === 4) checks.push({ key: diet, status: 'caution', title: 'Ultra-processed', detail: 'A Mediterranean diet favors whole foods' })
        else if (food.levels.saturatedFat === 'high' || food.levels.sugars === 'high')
          checks.push({ key: diet, status: 'caution', title: food.levels.sugars === 'high' ? 'High in sugar' : 'High in saturated fat' })
        else if (food.nova || hasIngredients) checks.push({ key: diet, status: 'ok', title: 'Fits a Mediterranean diet' })
        else checks.push({ key: diet, status: 'unknown', title: 'Mediterranean: not enough data' })
        break
      default:
        // A diet the person typed in: there is no rule to check it by.
        checks.push({ key: diet, status: 'unknown', title: `${diet}: check the label`, detail: 'Not checked automatically' })
    }
  }

  return checks.sort((a, b) => ORDER[a.status] - ORDER[b.status])
}

export function overallStatus(checks: Check[]): CheckStatus | null {
  if (checks.length === 0) return null
  if (checks.some((c) => c.status === 'conflict')) return 'conflict'
  if (checks.some((c) => c.status === 'caution')) return 'caution'
  if (checks.some((c) => c.status === 'unknown')) return 'unknown'
  return 'ok'
}
