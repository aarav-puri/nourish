'use client'

import { useEffect, useRef } from 'react'

export default function Particles() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const createParticle = () => {
      const particle = document.createElement('div')
      particle.className = 'particle'
      particle.style.left = `${Math.random() * 100}%`
      particle.style.animationDuration = `${15 + Math.random() * 20}s`
      particle.style.opacity = `${0.1 + Math.random() * 0.3}`
      particle.style.width = `${2 + Math.random() * 4}px`
      particle.style.height = particle.style.width
      container.appendChild(particle)

      setTimeout(() => particle.remove(), 35000)
    }

    // Create initial particles
    for (let i = 0; i < 30; i++) {
      setTimeout(createParticle, i * 200)
    }

    // Continue creating particles
    const interval = setInterval(createParticle, 1000)

    return () => {
      clearInterval(interval)
      container.innerHTML = ''
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    />
  )
}
