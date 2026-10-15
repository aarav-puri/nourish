/**
 * Barcode reading for the camera and for photos.
 *
 * The browser's own BarcodeDetector is used wherever it exists (Chrome on
 * Android, most Chromium desktops): it is fast and reads damaged codes well.
 * Elsewhere, notably Safari, Quagga does the work in JavaScript.
 */

const NATIVE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf']

export const QUAGGA_READERS = [
  'ean_reader',
  'ean_8_reader',
  'upc_reader',
  'upc_e_reader',
  'code_128_reader',
  'code_39_reader',
]

/** GTIN check digit (EAN-8, UPC-A, EAN-13, GTIN-14). Codes of other lengths pass. */
export function isValidGtin(code: string) {
  if (!/^\d+$/.test(code)) return false
  if (![8, 12, 13, 14].includes(code.length)) return code.length >= 6
  const digits = code.split('').map(Number)
  const check = digits.pop()!
  const sum = digits
    .reverse()
    .reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0)
  return (10 - (sum % 10)) % 10 === check
}

/** Keeps the digits only: some readers include spaces or a symbology prefix. */
export function normalizeCode(raw: string) {
  return raw.replace(/\D/g, '')
}

type NativeDetector = { detect: (src: CanvasImageSource | ImageBitmap) => Promise<{ rawValue: string }[]> }

let nativePromise: Promise<NativeDetector | null> | null = null

export function getNativeDetector(): Promise<NativeDetector | null> {
  if (nativePromise) return nativePromise
  nativePromise = (async () => {
    if (typeof window === 'undefined' || !('BarcodeDetector' in window)) return null
    try {
      const BD = (window as any).BarcodeDetector
      const supported: string[] = await BD.getSupportedFormats()
      const formats = NATIVE_FORMATS.filter((f) => supported.includes(f))
      if (!formats.includes('ean_13')) return null
      return new BD({ formats }) as NativeDetector
    } catch {
      return null
    }
  })()
  return nativePromise
}

/** Reads the first valid barcode in a photo, or null. */
export async function decodeImage(file: Blob): Promise<string | null> {
  const native = await getNativeDetector()
  if (native) {
    try {
      const bitmap = await createImageBitmap(file)
      const results = await native.detect(bitmap)
      bitmap.close?.()
      const hit = results.map((r) => normalizeCode(r.rawValue)).find(isValidGtin)
      if (hit) return hit
    } catch {
      /* fall back to Quagga */
    }
  }

  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

  const Quagga = (await import('quagga')).default as any
  // Try a couple of sizes: Quagga's locator is sensitive to scale.
  for (const size of [1280, 800]) {
    const code = await new Promise<string | null>((resolve) => {
      Quagga.decodeSingle(
        {
          src,
          numOfWorkers: 0,
          inputStream: { size },
          decoder: { readers: QUAGGA_READERS },
          locate: true,
        },
        (result: any) => resolve(result?.codeResult?.code ?? null)
      )
    })
    if (code && isValidGtin(normalizeCode(code))) return normalizeCode(code)
  }
  return null
}
