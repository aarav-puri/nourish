'use client'

import { useEffect, useRef, useState } from 'react'

export default function Particles() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Detect mobile devices
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Reduce particles on mobile for better performance
    const particleCount = isMobile ? 8 : 20
    const createInterval = isMobile ? 3000 : 1500
    const particleLifetime = isMobile ? 20000 : 30000

    const createParticle = () => {
      const particle = document.createElement('div')
      particle.className = 'particle'
      particle.style.left = `${Math.random() * 100}%`
      particle.style.animationDuration = `${12 + Math.random() * 15}s`
      particle.style.opacity = `${0.15 + Math.random() * 0.25}`
      const size = isMobile ? 2 + Math.random() * 2 : 2 + Math.random() * 4
      particle.style.width = `${size}px`
      particle.style.height = `${size}px`
      container.appendChild(particle)

      setTimeout(() => particle.remove(), particleLifetime)
    }

    // Create initial particles with staggered timing
    for (let i = 0; i < particleCount; i++) {
      setTimeout(createParticle, i * 300)
    }

    // Continue creating particles at a slower rate
    const interval = setInterval(createParticle, createInterval)

    return () => {
      clearInterval(interval)
      container.innerHTML = ''
    }
  }, [isMobile])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ willChange: 'transform' }}
    />
  )
}
