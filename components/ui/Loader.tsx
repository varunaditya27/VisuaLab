import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoaderProps {
  className?: string
  size?: number
}

const Loader = ({ className, size = 24 }: LoaderProps) => {
  return (
    <Loader2
      size={size}
      className={cn('animate-spin text-primary', className)}
    />
  )
}

export default Loader
