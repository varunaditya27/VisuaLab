"use client";

import { motion, MotionProps } from 'framer-motion';
import Link, { LinkProps } from 'next/link';
import { AnchorHTMLAttributes, forwardRef } from 'react';
import { hoverPulse } from '@/lib/animations';
import { cn } from '@/lib/utils';

type LinkButtonProps = LinkProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & MotionProps;

const MotionLink = motion(Link as any);

const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ className, children, href, ...props }, ref) => {
    const linkHref = href as LinkProps['href'];

    return (
      <MotionLink
        href={linkHref}
        ref={ref as any}
        variants={hoverPulse}
        whileHover="hover"
        whileTap="tap"
        className={cn(
          'relative inline-flex items-center justify-center px-4 py-2 overflow-hidden font-semibold text-white transition duration-300 ease-out border-2 border-purple-500/50 rounded-lg shadow-lg group backdrop-blur-sm text-sm',
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
      </MotionLink>
    );
  }
);

LinkButton.displayName = 'LinkButton';

export { LinkButton };