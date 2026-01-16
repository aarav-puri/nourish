'use client'

import { useEffect, useRef, useState } from 'react'
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
  const videoTrackRef = useRef<MediaStreamTrack | null>(null)

  useEffect(() => {
    mountedRef.current = true
    startScanner()
    
    return () => {
      mountedRef.current = false
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    try {
      const Quagga = (await import('quagga')).default

      Quagga.init({
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: document.querySelector('#barcode-scanner'),
          constraints: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            facingMode: 'environment',
            aspectRatio: { min: 1, max: 2 }
          },
          area: {
            top: '20%',
            right: '10%',
            left: '10%',
            bottom: '20%'
          }
        },
        locator: {
          patchSize: 'medium',
          halfSample: true
        },
        numOfWorkers: 2,
        frequency: 10,
        decoder: {
          readers: [
            'ean_reader',
            'ean_8_reader',
            'code_128_reader',
            'code_39_reader',
            'upc_reader',
            'upc_e_reader',
            'codabar_reader',
            'i2of5_reader'
          ],
          debug: {
            drawBoundingBox: true,
            showFrequency: false,
            drawScanline: true,
            showPattern: false
          }
        },
        locate: true
      }, (err: any) => {
        if (err) {
          console.error('Quagga init error:', err)
          if (mountedRef.current) {
            setError('Failed to start camera. Please check permissions.')
          }
          return
        }

        // Get video track for torch control
        const stream = Quagga.CameraAccess.getActiveStreamLabel()
        if (stream) {
          const videoTrack = Quagga.CameraAccess.getActiveTrack()
          if (videoTrack) {
            videoTrackRef.current = videoTrack
          }
        }

        Quagga.start()
        setIsScanning(true)
      })

      // Listen for detected barcodes
      Quagga.onDetected((result: any) => {
        if (result?.codeResult?.code && mountedRef.current) {
          const code = result.codeResult.code
          // Validate barcode
          if (code && code.length >= 8) {
            onScan(code)
            stopScanner()
          }
        }
      })

    } catch (err: any) {
      console.error('Scanner error:', err)
      if (mountedRef.current) {
        setError(err.message || 'Failed to start camera')
      }
    }
  }

  const stopScanner = async () => {
    try {
      const Quagga = (await import('quagga')).default
      Quagga.stop()
      Quagga.offDetected()
      Quagga.offProcessed()
      
      // Stop video track
      if (videoTrackRef.current) {
        videoTrackRef.current.stop()
        videoTrackRef.current = null
      }
    } catch (err) {
      console.error('Error stopping scanner:', err)
    }
  }

  const toggleTorch = async () => {
    if (videoTrackRef.current && isScanning) {
      try {
        const capabilities = videoTrackRef.current.getCapabilities() as any
        
        if (capabilities.torch) {
          await videoTrackRef.current.applyConstraints({
            advanced: [{ torch: !torchEnabled } as any]
          })
          setTorchEnabled(!torchEnabled)
        }
      } catch (err) {
        console.error('Torch error:', err)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-dark-card/95 backdrop-blur-lg border-b border-zinc-800">
        <h2 className="text-lg font-semibold">Scan Barcode</h2>
        <div className="flex items-center gap-2">
          {isScanning && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-lg transition-colors ${
                torchEnabled ? 'bg-yellow-500/20 text-yellow-400' : 'hover:bg-white/10'
              }`}
            >
              <Zap className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => {
              stopScanner()
              onClose()
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
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
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="w-full max-w-lg">
            <div 
              id="barcode-scanner" 
              className="rounded-xl overflow-hidden shadow-2xl relative"
              style={{ maxHeight: '60vh' }}
            >
              <canvas className="drawingBuffer" style={{ display: 'none' }} />
            </div>
            <div className="mt-6 space-y-3 text-center">
              <p className="text-white font-medium">
                Position barcode in the frame
              </p>
              <div className="text-sm text-zinc-400 space-y-1">
                <p>• Hold steady and ensure good lighting</p>
                <p>• Keep barcode horizontal and in focus</p>
                <p>• Move closer if not detecting</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
