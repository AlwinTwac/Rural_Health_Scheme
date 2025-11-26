import { useEffect, useRef } from 'react'

export function BloodCellAnimation() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Blood cell particles - fixed count, no spawning
    const particles = []
    const redCellCount = 40 // Reduced for better performance with collisions
    const whiteCellCount = 6 // Fewer white blood cells (they're rarer)
    
    // Ripple tracking (invisible - only affects physics)
    const ripples = []
    const centerX = canvas.width / 2
    const centerY = canvas.height * 0.15

    class Ripple {
      constructor() {
        this.radius = 0
        this.maxRadius = Math.max(canvas.width, canvas.height) * 2
        this.speed = 6
        this.strength = 4 // Much stronger displacement
      }

      update() {
        this.radius += this.speed
        this.strength = Math.max(0, 4 * (1 - this.radius / this.maxRadius))
        return this.radius < this.maxRadius
      }
    }

    class BloodCell {
      constructor(type = 'red') {
        this.type = type
        this.reset()
      }

      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        
        if (this.type === 'white') {
          this.radius = Math.random() * 8 + 8 // Larger (8-16px)
          this.opacity = Math.random() * 0.3 + 0.2
        } else {
          this.radius = Math.random() * 6 + 3 // Smaller (3-9px)
          this.opacity = Math.random() * 0.25 + 0.15
        }
        
        this.baseSpeedX = Math.random() * 1.2 + 0.4
        this.baseSpeedY = (Math.random() - 0.5) * 0.3
        this.speedX = this.baseSpeedX
        this.speedY = this.baseSpeedY
        this.rotation = Math.random() * Math.PI * 2
        this.rotationSpeed = (Math.random() - 0.5) * 0.02
        this.squish = Math.random() * 0.3 + 0.85
      }

      update() {
        // Calculate ripple influence (liquid displacement)
        let rippleForceX = 0
        let rippleForceY = 0
        let maxDisplacement = 0
        
        ripples.forEach(ripple => {
          const dx = this.x - centerX
          const dy = this.y - centerY
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // Check if this cell is near the ripple wave front
          const waveDiff = Math.abs(distance - ripple.radius)
          if (waveDiff < 200) { // Much wider influence zone
            // Calculate radial push force (like liquid displacement)
            const force = (1 - waveDiff / 200) * ripple.strength
            const angle = Math.atan2(dy, dx)
            rippleForceX += Math.cos(angle) * force * 1.5
            rippleForceY += Math.sin(angle) * force * 1.5
            maxDisplacement = Math.max(maxDisplacement, force)
          }
        })
        
        // Apply forces with smooth interpolation
        this.speedX = this.baseSpeedX + rippleForceX * 0.3
        this.speedY = this.baseSpeedY + rippleForceY * 0.3
        
        // Scale cells slightly when displaced (liquid compression effect)
        const targetSquish = this.squish * (1 + maxDisplacement * 0.2)
        this.currentSquish = this.currentSquish || this.squish
        this.currentSquish += (targetSquish - this.currentSquish) * 0.1
        
        // Move
        this.x += this.speedX
        this.y += this.speedY
        this.rotation += this.rotationSpeed + maxDisplacement * 0.05

        // Bounce off edges instead of wrapping
        if (this.x > canvas.width - this.radius) {
          this.x = canvas.width - this.radius
          this.baseSpeedX *= -1
          this.speedX *= -1
        }
        if (this.x < this.radius) {
          this.x = this.radius
          this.baseSpeedX *= -1
          this.speedX *= -1
        }
        if (this.y > canvas.height - this.radius) {
          this.y = canvas.height - this.radius
          this.baseSpeedY *= -1
          this.speedY *= -1
        }
        if (this.y < this.radius) {
          this.y = this.radius
          this.baseSpeedY *= -1
          this.speedY *= -1
        }
        
        // Random direction changes (very occasionally)
        if (Math.random() < 0.001) {
          this.baseSpeedX += (Math.random() - 0.5) * 0.1
          this.baseSpeedY += (Math.random() - 0.5) * 0.1
        }
        
        // Keep speed in reasonable range
        const speed = Math.sqrt(this.baseSpeedX ** 2 + this.baseSpeedY ** 2)
        if (speed > 1.8) {
          this.baseSpeedX = (this.baseSpeedX / speed) * 1.8
          this.baseSpeedY = (this.baseSpeedY / speed) * 1.8
        }
        if (speed < 0.3) {
          this.baseSpeedX = (this.baseSpeedX / speed) * 0.3
          this.baseSpeedY = (this.baseSpeedY / speed) * 0.3
        }
      }
      
      checkCollision(other) {
        const dx = other.x - this.x
        const dy = other.y - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const minDist = this.radius + other.radius
        
        if (distance < minDist && distance > 0) {
          // Collision detected - gentle bounce
          const angle = Math.atan2(dy, dx)
          
          // Calculate overlap
          const overlap = minDist - distance
          
          // Gently push cells apart
          const separationX = Math.cos(angle) * overlap * 0.5
          const separationY = Math.sin(angle) * overlap * 0.5
          
          this.x -= separationX
          this.y -= separationY
          other.x += separationX
          other.y += separationY
          
          // Very gentle velocity change
          const force = 0.02
          this.baseSpeedX -= separationX * force
          this.baseSpeedY -= separationY * force
          other.baseSpeedX += separationX * force
          other.baseSpeedY += separationY * force
        }
      }

      draw() {
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)

        const squish = this.currentSquish || this.squish

        if (this.type === 'white') {
          // White blood cell - larger, spherical, with nucleus
          ctx.globalAlpha = 1
          
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius)
          gradient.addColorStop(0, `rgba(245, 245, 255, ${this.opacity * 1.2})`)
          gradient.addColorStop(0.5, `rgba(220, 220, 240, ${this.opacity})`)
          gradient.addColorStop(1, `rgba(200, 200, 230, ${this.opacity * 0.5})`)

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(0, 0, this.radius, 0, Math.PI * 2)
          ctx.fill()

          // Nucleus (multi-lobed) - more visible
          ctx.fillStyle = `rgba(120, 120, 180, ${this.opacity * 0.8})`
          ctx.beginPath()
          ctx.arc(-this.radius * 0.25, 0, this.radius * 0.4, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(this.radius * 0.25, 0, this.radius * 0.4, 0, Math.PI * 2)
          ctx.fill()

          // Brighter outline
          ctx.strokeStyle = `rgba(240, 240, 255, ${this.opacity * 0.9})`
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(0, 0, this.radius * 0.92, 0, Math.PI * 2)
          ctx.stroke()
          
          ctx.globalAlpha = 1
        } else {
          // Red blood cell - biconcave disc
          ctx.globalAlpha = 1
          
          const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius)
          outerGradient.addColorStop(0, `rgba(150, 0, 0, ${this.opacity * 0.4})`)
          outerGradient.addColorStop(0.4, `rgba(220, 38, 38, ${this.opacity * 1.1})`)
          outerGradient.addColorStop(1, `rgba(180, 20, 20, ${this.opacity * 0.4})`)

          ctx.fillStyle = outerGradient
          ctx.beginPath()
          ctx.ellipse(0, 0, this.radius, this.radius * squish, 0, 0, Math.PI * 2)
          ctx.fill()

          // Center depression - more visible
          ctx.fillStyle = `rgba(100, 0, 0, ${this.opacity * 0.5})`
          ctx.beginPath()
          ctx.ellipse(0, 0, this.radius * 0.45, this.radius * 0.45 * squish, 0, 0, Math.PI * 2)
          ctx.fill()

          // Brighter highlight
          ctx.strokeStyle = `rgba(255, 120, 120, ${this.opacity * 0.7})`
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.ellipse(0, 0, this.radius * 0.88, this.radius * 0.88 * squish, 0, 0, Math.PI * 2)
          ctx.stroke()
          
          ctx.globalAlpha = 1
        }

        ctx.restore()
      }
    }

    // Initialize red blood cells
    for (let i = 0; i < redCellCount; i++) {
      particles.push(new BloodCell('red'))
    }
    
    // Initialize white blood cells
    for (let i = 0; i < whiteCellCount; i++) {
      particles.push(new BloodCell('white'))
    }

    // Create ripple every 2 seconds (matching logo pulse)
    const rippleInterval = setInterval(() => {
      ripples.push(new Ripple())
    }, 2000)

    // Initial ripple
    ripples.push(new Ripple())

    // Animation loop
    let lastTime = Date.now()
    
    function animate() {
      const now = Date.now()
      const deltaTime = now - lastTime
      lastTime = now
      
      // Skip frame if too much time has passed (tab was inactive)
      if (deltaTime > 100) {
        requestAnimationFrame(animate)
        return
      }
      
      // Clear with proper alpha
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (!ripples[i].update()) {
          ripples.splice(i, 1)
        }
      }

      // Update particles
      particles.forEach(particle => {
        particle.update()
      })
      
      // Check collisions between particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          particles[i].checkCollision(particles[j])
        }
      }
      
      // Draw particles
      particles.forEach(particle => {
        particle.draw()
      })

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
      className="absolute inset-0 pointer-events-none"
      style={{ 
        opacity: 0.8,
        imageRendering: 'auto',
        transform: 'translateZ(0)', // Force GPU acceleration
        willChange: 'contents'
      }}
    />
  )
}
