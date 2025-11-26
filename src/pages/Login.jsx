import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, LogIn } from 'lucide-react'
import { BloodCellAnimation } from '@/components/animations/BloodCellAnimation'
import { SineWaveAnimation } from '@/components/animations/SineWaveAnimation' // Now contains ECG + Aurora
import { LiquidDistortion } from '@/components/animations/LiquidDistortion'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isFormActive, setIsFormActive] = useState(false)
  const contentRef = useRef(null)
  const displacementRef = useRef(null)
  const baseFreqRef = useRef(null)

  useEffect(() => {
    let animationFrame
    const startTime = Date.now()

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000
      
      // Keep displacement always active with stronger ripple
      const strength = 12 + Math.sin(elapsed * Math.PI) * 10 // Oscillates between 2 and 22
      
      // Slowly evolve turbulence
      const freq = 0.01 + Math.sin(elapsed * 0.3) * 0.003
      
      // Update attributes directly
      if (displacementRef.current) {
        displacementRef.current.setAttribute('scale', strength.toFixed(2))
      }
      
      if (baseFreqRef.current) {
        baseFreqRef.current.setAttribute('baseFrequency', `${freq.toFixed(4)} ${freq.toFixed(4)}`)
      }
      
      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', credentials)
      
      console.log('Login response:', response)
      
      // The axios interceptor returns response.data, so response is already the data object
      if (response.success) {
        // Update auth context and store token
        login(response.user, response.token)
        
        // Navigate to dashboard
        navigate('/', { replace: true })
      } else {
        setError(response.message || 'Invalid credentials')
      }
    } catch (err) {
      // Handle error response
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.'
      setError(errorMessage)
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* SVG Filter for water distortion */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="waterDistortion" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              ref={baseFreqRef}
              type="fractalNoise"
              baseFrequency="0.01 0.01"
              numOctaves="1"
              seed="1"
              result="turbulence"
            />
            <feDisplacementMap
              ref={displacementRef}
              in="SourceGraphic"
              in2="turbulence"
              scale="15"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Everything that should be distorted goes in this container */}
      <div 
        ref={contentRef}
        className="absolute"
        style={{
          filter: 'url(#waterDistortion)',
          willChange: 'filter',
          top: '-5%',
          left: '-5%',
          right: '-5%',
          bottom: '-5%',
          width: '110%',
          height: '110%'
        }}
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/stethoscope2.png)',
            filter: 'brightness(0.4)'
          }}
        />

        {/* Sine Wave Animation at Bottom */}
        <SineWaveAnimation />
      </div>

      {/* Blood Cell Animation Overlay - Outside distortion container so it's always visible */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <BloodCellAnimation />
      </div>

      {/* Login Form Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 shadow-lg relative overflow-hidden">
              {/* Pulsing ring animation */}
              <div className="absolute inset-0 rounded-2xl bg-primary-600/30 animate-ping opacity-75"></div>
              <div className="absolute inset-0 rounded-2xl bg-primary-600/20 animate-pulse"></div>
              
              {/* Logo Image */}
              <img 
                src="/medhub_logo.png" 
                alt="MedHub Logo" 
                className="w-20 h-20 object-contain relative z-10"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Rural Health Scheme
            </h1>
            <p className="text-gray-300">
              Central Hub Management System
            </p>
          </div>

          {/* Login Card */}
          <div 
            className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 overflow-hidden transition-all duration-500"
            onMouseEnter={() => setIsFormActive(true)}
            onMouseLeave={() => setIsFormActive(false)}
            onFocus={() => setIsFormActive(true)}
          >
            {/* Background image that appears on hover/focus */}
            <div 
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
                isFormActive ? 'opacity-30' : 'opacity-0'
              }`}
              style={{
                backgroundImage: 'url(/stethoscope1.png)',
                filter: 'blur(2px)'
              }}
            />
            
            {/* Content overlay */}
            <div className="relative z-10">
              <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                Sign In
              </h2>

            {error && (
              <div className="mb-4 p-3 bg-danger-500/20 border border-danger-500/50 rounded-lg text-danger-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-hover:text-primary-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={credentials.username}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-hover:text-primary-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
              </form>

              {/* Default Credentials Info */}
              <div className="mt-6 p-3 bg-primary-500/20 border border-primary-500/30 rounded-lg">
                <p className="text-xs text-gray-300 text-center">
                  Default credentials: <span className="font-semibold text-white">admin</span> / <span className="font-semibold text-white">admin123</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Absolute Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-20 pb-4">
        <p className="text-center text-gray-400 text-sm">
          © 2025 Rural Health Scheme. All rights reserved.
        </p>
      </div>
    </div>
  )
}
