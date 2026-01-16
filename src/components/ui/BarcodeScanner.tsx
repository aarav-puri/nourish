'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, X, Zap } from 'lucide-react'
import Button from './Button'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [torchEnabled, setTorchEnabled] = useState(false)
  const mountedRef = useRef(true)
  const quaggaRef = useRef<any>(null)
  const lastCodeRef = useRef<string | null>(null)
  const codeCountRef = useRef<number>(0)

  const stopScanner = useCallback(async () => {
    if (quaggaRef.current) {
      try {
        quaggaRef.current.offDetected()
        quaggaRef.current.stop()
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
  }, [])

  const handleDetected = useCallback((result: any) => {
    if (!result?.codeResult?.code || !mountedRef.current) return
    
    const code = result.codeResult.code
    
    // Require same code detected multiple times to reduce false positives
    if (code === lastCodeRef.current) {
      codeCountRef.current++
    } else {
      lastCodeRef.current = code
      codeCountRef.current = 1
    }
    
    // Only accept after 3 consistent reads
    if (codeCountRef.current >= 3 && code.length >= 8) {
      stopScanner()
      onScan(code)
    }
  }, [onScan, stopScanner])

  useEffect(() => {
    mountedRef.current = true
    
    const initScanner = async () => {
      try {
        const Quagga = (await import('quagga')).default as any
        quaggaRef.current = Quagga

        const config = {
          inputStream: {
            type: 'LiveStream',
            target: document.querySelector('#barcode-scanner'),
            constraints: {
              facingMode: 'environment'
            },
            area: {
              top: '25%',
              right: '10%',
              left: '10%',
              bottom: '25%'
            }
          },
          locator: {
            patchSize: 'medium',
            halfSample: true
          },
          numOfWorkers: navigator.hardwareConcurrency || 4,
          frequency: 10,
          decoder: {
            readers: [
              'ean_reader',
              'ean_8_reader',
              'upc_reader',
              'upc_e_reader',
              'code_128_reader',
              'code_39_reader',
              'codabar_reader',
              'i2of5_reader'
            ],
            multiple: false
          },
          locate: true
        }

        Quagga.init(config, (err: any) => {
          if (err) {
            console.error('Quagga init error:', err)
            if (mountedRef.current) {
              setError('Failed to access camera. Please check permissions.')
            }
            return
          }

          if (mountedRef.current) {
            Quagga.start()
            setIsScanning(true)
          }
        })

        Quagga.onDetected(handleDetected)

      } catch (err: any) {
        console.error('Scanner error:', err)
        if (mountedRef.current) {
          setError(err.message || 'Failed to start camera')
        }
      }
    }

    initScanner()
    
    return () => {
      mountedRef.current = false
      stopScanner()
    }
  }, [handleDetected, stopScanner])

  const toggleTorch = async () => {
    if (quaggaRef.current && isScanning) {
      try {
        const track = quaggaRef.current.CameraAccess?.getActiveTrack?.()
        if (track) {
          const capabilities = track.getCapabilities() as any
          if (capabilities.torch) {
            await track.applyConstraints({
              advanced: [{ torch: !torchEnabled }]
            })
            setTorchEnabled(!torchEnabled)
          }
        }
      } catch (err) {
        console.error('Torch error:', err)
      }
    }
  }

  const handleClose = () => {
    stopScanner()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-dark-card/95 backdrop-blur-lg border-b border-zinc-800">
        <h2 className="text-lg font-semibold">Scan Barcode</h2>
        <div className="flex items-center gap-2">
          {isScanning && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-lg transition-colors ${
                torchEnabled ? 'bg-yellow-500/20 text-yellow-400' : 'hover:bg-white/10'
              }`}
              aria-label="Toggle flashlight"
            >
              <Zap className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close scanner"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        {error ? (
          <div className="text-center px-4">
            <Camera className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-2 font-semibold">Camera Access Required</p>
            <p className="text-zinc-400 text-sm mb-6">{error}</p>
            <div className="space-y-2 text-left text-sm text-zinc-400 mb-6">
              <p>• Allow camera permissions in your browser</p>
              <p>• Make sure no other app is using the camera</p>
              <p>• Try refreshing the page</p>
            </div>
            <Button onClick={handleClose}>Close</Button>
          </div>
        ) : (
          <div className="w-full max-w-lg">
            <div 
              id="barcode-scanner" 
              className="rounded-xl overflow-hidden shadow-2xl relative bg-black"
              style={{ maxHeight: '50vh', aspectRatio: '4/3' }}
            />
            <div className="mt-6 space-y-3 text-center">
              <p className="text-white font-medium">Position barcode in the frame</p>
              <div className="text-sm text-zinc-400 space-y-1">
                <p>• Hold steady with good lighting</p>
                <p>• Keep barcode horizontal and in focus</p>
                <p>• Move closer for small barcodes</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
