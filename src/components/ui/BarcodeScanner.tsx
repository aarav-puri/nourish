'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, X } from 'lucide-react'
import Button from './Button'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    startScanner()
    return () => {
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode('barcode-scanner')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback
          onScan(decodedText)
          stopScanner()
        },
        (errorMessage) => {
          // Error callback (can be ignored for continuous scanning)
          // console.log('Scan error:', errorMessage)
        }
      )
      setIsScanning(true)
    } catch (err: any) {
      console.error('Scanner error:', err)
      setError(err.message || 'Failed to start camera')
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-dark-card/95 backdrop-blur-lg border-b border-zinc-800">
        <h2 className="text-lg font-semibold">Scan Barcode</h2>
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

      {/* Scanner Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {error ? (
          <div className="text-center">
            <Camera className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <div id="barcode-scanner" className="rounded-xl overflow-hidden" />
            <p className="text-center text-zinc-400 mt-4 text-sm">
              Position the barcode within the frame
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
