import { useEffect, useRef } from 'react'

export function RippleEffect() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Ripple waves that emanate from center
    const ripples = []
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight * 0.15 // Position near logo

    class Ripple {
      constructor() {
        this.radius = 0
        this.maxRadius = Math.max(window.innerWidth, window.innerHeight) * 1.5
        this.speed = 3
        this.opacity = 0.6
        this.lineWidth = 2
      }

      update() {
        this.radius += this.speed
        this.opacity = Math.max(0, 0.6 * (1 - this.radius / this.maxRadius))
        
        // Remove ripple when it's fully expanded
        if (this.radius >= this.maxRadius) {
          return false
        }
        return true
      }

      draw() {
        ctx.beginPath()
        ctx.arc(centerX, centerY, this.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(239, 68, 68, ${this.opacity * 0.3})` // Red ripple
        ctx.lineWidth = this.lineWidth
        ctx.stroke()
        
        // Inner glow
        ctx.strokeStyle = `rgba(252, 165, 165, ${this.opacity * 0.5})` // Lighter red
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    // Create ripple every 2 seconds (matching pulse animation)
    const rippleInterval = setInterval(() => {
      ripples.push(new Ripple())
    }, 2000)

    // Initial ripple
    ripples.push(new Ripple())

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i]
        const alive = ripple.update()
        if (!alive) {
          ripples.splice(i, 1)
        } else {
          ripple.draw()
        }
      }

      requestAnimationFrame(animate)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearInterval(rippleInterval)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-5"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
