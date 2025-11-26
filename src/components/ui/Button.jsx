import { cn } from '@/lib/utils'

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  disabled,
  ...props 
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    ghost: 'hover:bg-gray-100 text-gray-700',
    outline: 'border-2 border-gray-300 hover:bg-gray-50 text-gray-700',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={cn(
        'btn',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
