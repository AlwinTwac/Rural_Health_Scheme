import { useEffect, useRef } from 'react'

export function SineWaveAnimation() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    let time = 0
    let offset = 0
    const baselineY = canvas.height * 0.92 // Position ECG lower (92% down)

    // Aurora colors (cyan, teal, blue, purple)
    const auroraColors = [
      { r: 6, g: 182, b: 212, a: 0.15 },    // Cyan
      { r: 20, g: 184, b: 166, a: 0.12 },   // Teal
      { r: 59, g: 130, b: 246, a: 0.1 },    // Blue
      { r: 139, g: 92, b: 246, a: 0.08 },   // Purple
    ]

    class AuroraWave {
      constructor(index) {
        this.index = index
        this.amplitude = 40 + Math.random() * 30
        this.frequency = 0.001 + Math.random() * 0.0005
        this.speed = 0.01 + Math.random() * 0.005
        this.phase = Math.random() * Math.PI * 2
        this.yOffset = canvas.height * 0.85 + (index * 15)
        this.color = auroraColors[index % auroraColors.length]
      }

      draw(time) {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a})`
        ctx.lineWidth = 2
        ctx.lineCap = 'round'

        for (let x = 0; x <= canvas.width; x += 3) {
          const y = this.yOffset + 
                   Math.sin(x * this.frequency + time * this.speed + this.phase) * 
                   this.amplitude

          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.shadowBlur = 20
        ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.3)`
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    }

    // ECG Wave Generator - Continuous pattern
    class ECGWave {
      constructor() {
        this.patternWidth = 200 // Width of one complete heartbeat cycle
      }

      // Get Y position for any X coordinate (creates continuous pattern)
      getYForX(x) {
        // Normalize x to pattern cycle (0-200)
        const cycleX = x % this.patternWidth
        
        // Baseline (flat line)
        if (cycleX < 20) return baselineY
        
        // P wave (small bump)
        if (cycleX < 40) {
          const t = (cycleX - 20) / 20
          return baselineY - Math.sin(t * Math.PI) * 8
        }
        
        // PR segment (flat)
        if (cycleX < 60) return baselineY
        
        // Q dip
        if (cycleX < 70) {
          const t = (cycleX - 60) / 10
          return baselineY + Math.sin(t * Math.PI) * 15
        }
        
        // R spike (main heartbeat)
        if (cycleX < 80) {
          const t = (cycleX - 70) / 10
          return baselineY - Math.sin(t * Math.PI) * 70
        }
        
        // S dip
        if (cycleX < 90) {
          const t = (cycleX - 80) / 10
          return baselineY + Math.sin(t * Math.PI) * 20
        }
        
        // ST segment (flat)
        if (cycleX < 120) return baselineY
        
        // T wave (rounded bump)
        if (cycleX < 160) {
          const t = (cycleX - 120) / 40
          return baselineY - Math.sin(t * Math.PI) * 15
        }
        
        // Back to baseline
        return baselineY
      }

      draw(offset) {
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)' // Green ECG line
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        // Draw continuous ECG line across entire width
        for (let x = 0; x <= canvas.width; x += 2) {
          const adjustedX = x + offset
          const y = this.getYForX(adjustedX)
          
          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.shadowBlur = 10
        ctx.shadowColor = 'rgba(34, 197, 94, 0.6)'
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    }

    // Initialize aurora waves
    const auroraWaves = []
    for (let i = 0; i < 4; i++) {
      auroraWaves.push(new AuroraWave(i))
    }

    // Initialize ECG
    const ecg = new ECGWave()

    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      time++
      offset += 2 // Scroll speed

      // Draw aurora effect
      auroraWaves.forEach(wave => {
        wave.draw(time)
      })

      // Draw continuous ECG
      ecg.draw(offset)

      requestAnimationFrame(animate)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      
      // Update aurora wave positions
      auroraWaves.forEach((wave, index) => {
        wave.yOffset = canvas.height * 0.92 + (index * 15)
      })
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[2]"
    />
  )
}
