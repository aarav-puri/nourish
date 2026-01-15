declare module 'quagga' {
  interface QuaggaConfig {
    src?: string
    numOfWorkers?: number
    decoder?: {
      readers?: string[]
    }
    locate?: boolean
    inputStream?: {
      type?: string
      target?: HTMLElement | null
      constraints?: {
        facingMode?: string
      }
    }
  }

  interface QuaggaResult {
    codeResult?: {
      code?: string
      format?: string
    }
  }

  const Quagga: {
    decodeSingle: (config: QuaggaConfig, callback: (result: QuaggaResult) => void) => void
    init: (config: QuaggaConfig, callback: (err: Error | null) => void) => void
    start: () => void
    stop: () => void
    onDetected: (callback: (result: QuaggaResult) => void) => void
  }

  export default Quagga
}
