"use client";
import { motion } from 'framer-motion';
import { useMemo } from 'react';

const AnimatedBackground = () => {
  const variants = {
    initial: {
      backgroundPosition: '0% 50%',
    },
    animate: {
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
    },
  };

  const transition = useMemo(
    () => ({
      duration: 40,
      ease: 'linear',
      repeat: Infinity,
    }),
    []
  );

  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(270deg, #0a0a23, #1f1f3d, #0a0a23, #3c3c7a)',
          backgroundSize: '400% 400%',
        }}
        variants={variants}
        initial="initial"
        animate="animate"
        transition={transition}
      />
    </div>
  );
};

export default AnimatedBackground;