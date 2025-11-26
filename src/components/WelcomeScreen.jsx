import { useState, useEffect } from 'react'
import { Activity } from 'lucide-react'

export function WelcomeScreen({ onComplete, userName }) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const greeting = getGreeting()
  const fullMessage = `${greeting}, ${userName || 'Doctor'}!`

  useEffect(() => {
    if (currentIndex < fullMessage.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullMessage.substring(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, 90) // Faster typing speed (was 80ms)
      
      return () => clearTimeout(timeout)
    } else if (currentIndex === fullMessage.length && !isComplete) {
      setIsComplete(true)
    }
  }, [currentIndex, fullMessage, isComplete])

  useEffect(() => {
    if (isComplete) {
      // Wait 800ms after typing completes, then fade out
      const fadeTimer = setTimeout(() => {
        setFadeOut(true)
      }, 800)

      // Call onComplete after fade out animation (1.2s)
      const completeTimer = setTimeout(() => {
        onComplete()
      }, 2000)

      return () => {
        clearTimeout(fadeTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isComplete, onComplete])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-1000 ${
        fadeOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      {/* Same background as dashboard */}
      <div className="fixed inset-0 bg-slate-100 dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 animate-gradient-shift">
        {/* Animated gradient orbs */}
        <div className="hidden dark:block absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="hidden dark:block absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Medical watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="absolute opacity-[0.03] dark:opacity-[0.05]">
            <svg width="600" height="600" viewBox="0 0 200 200" className="text-gray-400 dark:text-white">
              <path
                d="M70 0 H130 V70 H200 V130 H130 V200 H70 V130 H0 V70 H70 Z"
                fill="currentColor"
              />
            </svg>
          </div>
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[-15deg]">
            <h1 className="text-[120px] font-bold opacity-[0.02] dark:opacity-[0.04] text-gray-400 dark:text-white whitespace-nowrap select-none">
              MedHub Connect
            </h1>
          </div>
        </div>
      </div>

      {/* Welcome message */}
      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/50 animate-pulse">
            <Activity className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Typewriter text with fade-in letters */}
        <div className="min-h-[80px] flex items-center justify-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
            {displayedText.split('').map((char, idx) => (
              <span
                key={`char-${idx}`}
                className="animate-letter-fade-in inline-block"
                style={{
                  minWidth: char === ' ' ? '0.3em' : 'auto'
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
            {!isComplete && (
              <span className="inline-block w-1 h-12 md:h-14 ml-2 bg-purple-500 animate-blink" />
            )}
          </h1>
        </div>

        {/* Subtitle */}
        <p className={`mt-6 text-lg text-gray-600 dark:text-gray-300 transition-all duration-700 ${isComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          Loading your dashboard...
        </p>
      </div>
    </div>
  )
}
