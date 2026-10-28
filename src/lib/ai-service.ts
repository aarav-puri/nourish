const API_KEY_STORAGE_KEY = 'gemini_api_key'

export function getGeminiApiKey() {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function setGeminiApiKey(key: string) {
  if (typeof window === 'undefined') return
  if (key) localStorage.setItem(API_KEY_STORAGE_KEY, key)
  else localStorage.removeItem(API_KEY_STORAGE_KEY)
}

/** Shows the first and last few characters so a person can tell which key is saved. */
export function maskKey(key: string) {
  if (key.length <= 10) return '•'.repeat(key.length)
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`
}
