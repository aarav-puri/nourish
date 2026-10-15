import type { Food } from '@/lib/food'

/* Products already loaded this session, keyed by barcode. The scanner reads
   it before fetching, and history seeds it, so opening a past scan is instant
   and moving back and forward never repeats a lookup. */
export const productCache = new Map<string, Food>()
