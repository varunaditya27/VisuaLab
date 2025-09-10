"use client";
import { motion, MotionProps } from 'framer-motion';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { hoverPulse } from '@/lib/animations';
import { cn } from '@/lib/utils';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & MotionProps;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        variants={hoverPulse}
        whileHover="hover"
        whileTap="tap"
        className={cn(
          'relative inline-flex items-center justify-center px-6 py-2.5 overflow-hidden font-semibold text-white transition duration-300 ease-out border-2 border-purple-500/50 rounded-lg shadow-lg group backdrop-blur-sm',
          className
        )}
        {...props}
      >
  {/* Gradient Background */}
  <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-600/70 via-blue-500/70 to-indigo-700/70 opacity-80 group-hover:opacity-100 transition-opacity duration-300"></span>
        {/* Shine Effect */}
        <span className="absolute top-0 left-0 w-full h-full transition-all duration-300 ease-in-out transform -translate-x-full bg-white opacity-20 group-hover:translate-x-full group-hover:skew-x-12"></span>

        {/* Content */}
        <span className="relative">{children}</span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };