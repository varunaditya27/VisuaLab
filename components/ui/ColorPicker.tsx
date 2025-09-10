'use client'

import { useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { motion, AnimatePresence } from 'framer-motion'
import useClickOutside from '@/hooks/useClickOutside'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export const ColorPicker = ({ color, onChange }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const popover = useClickOutside<HTMLDivElement>(() => setIsOpen(false))

  return (
    <div className="relative">
      <div
        className="w-full h-10 rounded-lg border-2 border-white/20 cursor-pointer"
        style={{ backgroundColor: color }}
        onClick={() => setIsOpen(true)}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popover}
            className="absolute top-full left-0 mt-2 z-10 p-2 bg-gray-800/80 backdrop-blur-md rounded-lg shadow-2xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <HexColorPicker color={color} onChange={onChange} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}