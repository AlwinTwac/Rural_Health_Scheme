import { useEffect, useRef } from 'react'

export function LiquidDistortion() {
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const overlay = overlayRef.current
    if (!canvas || !overlay) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight * 0.15

    let ripplePhase = 0
    let rippleActive = false

    // Trigger ripple every 2 seconds
    setInterval(() => {
      rippleActive = true
      ripplePhase = 0
      overlay.style.opacity = '0.3'
    }, 2000)

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (rippleActive) {
        ripplePhase += 0.05
        
        // Draw distortion waves
        const maxRadius = Math.max(canvas.width, canvas.height) * 1.5
        const currentRadius = ripplePhase * 200
        
        if (currentRadius > maxRadius) {
          rippleActive = false
          overlay.style.opacity = '0'
        } else {
          // Draw multiple wave rings
          for (let i = 0; i < 5; i++) {
            const radius = currentRadius - (i * 50)
            if (radius > 0) {
              const opacity = (1 - ripplePhase) * (1 - i * 0.15)
              
              // Draw wavy circle
              ctx.beginPath()
              for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                const wave = Math.sin(angle * 8 + ripplePhase * 5) * 10
                const r = radius + wave
                const x = centerX + Math.cos(angle) * r
                const y = centerY + Math.sin(angle) * r
                
                if (angle === 0) {
                  ctx.moveTo(x, y)
                } else {
                  ctx.lineTo(x, y)
                }
              }
              ctx.closePath()
              ctx.strokeStyle = `rgba(220, 38, 38, ${opacity * 0.4})`
              ctx.lineWidth = 3
              ctx.stroke()
              
              // Fill with gradient
              const gradient = ctx.createRadialGradient(centerX, centerY, radius - 20, centerX, centerY, radius + 20)
              gradient.addColorStop(0, `rgba(220, 38, 38, ${opacity * 0.05})`)
              gradient.addColorStop(1, 'transparent')
              ctx.fillStyle = gradient
              ctx.fill()
            }
          }
          
          // Fade overlay
          overlay.style.opacity = (1 - ripplePhase) * 0.3
        }
      }

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{ mixBlendMode: 'screen' }}
      />
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none z-[2] transition-opacity duration-300"
        style={{
          opacity: 0,
          background: `radial-gradient(circle at 50% 15%, 
            rgba(220, 38, 38, 0.4) 0%, 
            rgba(220, 38, 38, 0.2) 20%, 
            rgba(220, 38, 38, 0.05) 40%,
            transparent 60%)`,
          filter: 'blur(20px)'
        }}
      />
    </>
  )
}
