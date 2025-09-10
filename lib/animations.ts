import { Variants } from 'framer-motion';

/**
 * @param direction - The direction from which the element should fade in.
 * @param delay - The delay before the animation starts.
 * @returns Framer Motion variants for a fade-in animation.
 */
export const fadeIn = (direction: 'up' | 'down' | 'left' | 'right' = 'up', delay = 0): Variants => ({
  initial: {
    y: direction === 'up' ? 20 : direction === 'down' ? -20 : 0,
    x: direction === 'left' ? 20 : direction === 'right' ? -20 : 0,
    opacity: 0,
  },
  animate: {
    y: 0,
    x: 0,
    opacity: 1,
    transition: {
      type: 'tween',
      duration: 0.4,
      delay,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
});

/**
 * Framer Motion variants for a scale-in animation.
 */
export const scaleIn: Variants = {
  initial: {
    scale: 0.9,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
};

/**
 * Framer Motion variants for a container that staggers its children's animations.
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/**
 * Framer Motion variants for a child item within a stagger container.
 */
export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 15,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
};

/**
 * Framer Motion variants for a subtle pulse animation on hover.
 */
export const hoverPulse: Variants = {
  hover: {
    scale: 1.05,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 15,
    },
  },
  tap: {
    scale: 0.95,
  },
};
