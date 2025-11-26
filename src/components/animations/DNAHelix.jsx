import { useEffect, useRef } from 'react'

export function DNAHelix() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationFrameId
    let rotation = 0

    // Set canvas size
    const resizeCanvas = () => {
      // Use fixed width for expanded sidebar (256px = w-64)
      canvas.width = 256
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // DNA Helix parameters - fixed dimensions
    const helixWidth = 256 * 0.7 // 70% of expanded sidebar width (enhanced)
    const centerX = 256 / 2 + 48 // Shifted right by 48px (slightly left from previous)
    const amplitude = helixWidth / 2
    const frequency = 0.015 // Slightly tighter helix
    const numPoints = 150 // More points for smoother curves
    const baseSpacing = 12 // Closer base pairs for denser look

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      rotation += 0.005 // Slow rotation speed

      // Draw DNA strands with glow effect
      for (let strand = 0; strand < 2; strand++) {
        const offset = strand * Math.PI
        
        // Outer glow
        ctx.beginPath()
        ctx.strokeStyle = strand === 0 
          ? 'rgba(236, 72, 153, 0.15)' // Pink glow
          : 'rgba(147, 51, 234, 0.15)' // Purple glow
        ctx.lineWidth = 6
        ctx.shadowBlur = 10
        ctx.shadowColor = strand === 0 ? 'rgba(236, 72, 153, 0.5)' : 'rgba(147, 51, 234, 0.5)'

        for (let i = 0; i < numPoints; i++) {
          const y = (canvas.height / numPoints) * i
          const angle = y * frequency + rotation + offset
          const x = centerX + Math.sin(angle) * amplitude

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
        
        // Inner strand (brighter)
        ctx.shadowBlur = 0
        ctx.beginPath()
        ctx.strokeStyle = strand === 0 
          ? 'rgba(236, 72, 153, 0.5)' // Pink strand
          : 'rgba(147, 51, 234, 0.5)' // Purple strand
        ctx.lineWidth = 3

        for (let i = 0; i < numPoints; i++) {
          const y = (canvas.height / numPoints) * i
          const angle = y * frequency + rotation + offset
          const x = centerX + Math.sin(angle) * amplitude

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
      }
      
      ctx.shadowBlur = 0 // Reset shadow

      // Draw connecting base pairs
      for (let i = 0; i < Math.floor(canvas.height / baseSpacing); i++) {
        const y = i * baseSpacing
        const angle1 = y * frequency + rotation
        const angle2 = y * frequency + rotation + Math.PI
        
        const x1 = centerX + Math.sin(angle1) * amplitude
        const x2 = centerX + Math.sin(angle2) * amplitude

        // Only draw if strands are close enough (creates the helix effect)
        const distance = Math.abs(Math.cos(angle1))
        if (distance > 0.3) {
          // Gradient for base pair with glow
          const gradient = ctx.createLinearGradient(x1, y, x2, y)
          gradient.addColorStop(0, 'rgba(236, 72, 153, 0.3)')
          gradient.addColorStop(0.5, 'rgba(192, 132, 252, 0.4)')
          gradient.addColorStop(1, 'rgba(147, 51, 234, 0.3)')

          ctx.beginPath()
          ctx.strokeStyle = gradient
          ctx.lineWidth = 2.5
          ctx.shadowBlur = 5
          ctx.shadowColor = 'rgba(192, 132, 252, 0.5)'
          ctx.moveTo(x1, y)
          ctx.lineTo(x2, y)
          ctx.stroke()
          ctx.shadowBlur = 0

          // Draw nucleotide dots with glow
          // Pink nucleotide
          ctx.shadowBlur = 8
          ctx.shadowColor = 'rgba(236, 72, 153, 0.8)'
          ctx.fillStyle = 'rgba(236, 72, 153, 0.6)'
          ctx.beginPath()
          ctx.arc(x1, y, 4, 0, Math.PI * 2)
          ctx.fill()

          // Purple nucleotide
          ctx.shadowColor = 'rgba(147, 51, 234, 0.8)'
          ctx.fillStyle = 'rgba(147, 51, 234, 0.6)'
          ctx.beginPath()
          ctx.arc(x2, y, 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute left-0 top-0 h-full pointer-events-none opacity-30 dark:opacity-40"
      style={{ 
        mixBlendMode: 'screen',
        width: '256px' // Fixed width matching expanded sidebar
      }}
    />
  )
}
