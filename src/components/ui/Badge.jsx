import { cn } from '@/lib/utils'

export function Badge({ variant = 'info', className, children, ...props }) {
  const variants = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
  }

  return (
    <span className={cn('badge', variants[variant], className)} {...props}>
      {children}
    </span>
  )
}
