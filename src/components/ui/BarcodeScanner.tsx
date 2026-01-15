'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Camera, X, Zap } from 'lucide-react'
import Button from './Button'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [torchEnabled, setTorchEnabled] = useState(false)
  const mountedRef = useRef(true)

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
      const scanner = new Html5Qrcode('barcode-scanner', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
        ],
        verbose: false,
      })
      scannerRef.current = scanner

      const config = {
        fps: 10,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
          const qrboxSize = Math.floor(minEdge * 0.7)
          return {
            width: qrboxSize,
            height: Math.floor(qrboxSize * 0.4), // Wider box for barcodes
          }
        },
        aspectRatio: 1.777778, // 16:9
        disableFlip: false,
      }

      await scanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          if (mountedRef.current) {
            onScan(decodedText)
            stopScanner()
          }
        },
        () => {
          // Silently ignore scan errors during continuous scanning
        }
      )
      
      setIsScanning(true)
    } catch (err: any) {
      console.error('Scanner error:', err)
      if (mountedRef.current) {
        setError(err.message || 'Failed to start camera. Please check permissions.')
      }
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
        scannerRef.current.clear()
        scannerRef.current = null
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
  }

  const toggleTorch = async () => {
    if (scannerRef.current && isScanning) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        })
        const track = stream.getVideoTracks()[0]
        const capabilities = track.getCapabilities() as any
        
        if (capabilities.torch) {
          await track.applyConstraints({
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
            <div id="barcode-scanner" className="rounded-xl overflow-hidden shadow-2xl" />
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
