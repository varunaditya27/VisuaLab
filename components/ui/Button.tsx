"use client";
import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef, Children } from 'react';
import { hoverPulse } from '@/lib/animations';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'outline' | 'destructive';

type ButtonProps = HTMLMotionProps<'button'> & { variant?: Variant };

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground border-primary hover:bg-primary/90',
  ghost: 'bg-transparent border-transparent text-foreground hover:bg-accent',
  outline: 'bg-transparent border-border text-foreground hover:bg-accent',
  destructive: 'bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90'
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = 'primary', ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        variants={hoverPulse}
        whileHover="hover"
        whileTap="tap"
        className={cn(
          'relative inline-flex items-center justify-center px-6 py-2.5 overflow-hidden font-semibold transition duration-300 ease-out rounded-lg shadow-sm group backdrop-blur-sm border',
          variantClasses[variant],
          className
        )}
        {...props}
      >
  <span className="relative z-10 flex items-center">{Children.toArray(children as any)}</span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };