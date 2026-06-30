'use client'

import { motion, useReducedMotion } from 'framer-motion'

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface CornerWreathProps {
  corner: Corner
  className?: string
  size?: number
}

const cornerStyles: Record<Corner, string> = {
  'top-left': 'top-0 left-0',
  'top-right': 'top-0 right-0 -scale-x-100',
  'bottom-left': 'bottom-0 left-0 -scale-y-100',
  'bottom-right': 'bottom-0 right-0 -scale-x-100 -scale-y-100',
}

export function CornerWreath({ corner, className = '', size = 120 }: CornerWreathProps) {
  const prefersReducedMotion = useReducedMotion()

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: {
          delay: prefersReducedMotion ? 0 : i * 0.2,
          duration: prefersReducedMotion ? 0 : 1.5,
          ease: 'easeInOut' as const,
        },
        opacity: { delay: prefersReducedMotion ? 0 : i * 0.2, duration: 0.3 },
      },
    }),
  }

  return (
    <div className={`absolute pointer-events-none ${cornerStyles[corner]} ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        className="overflow-visible"
      >
        {/* Main branch */}
        <motion.path
          d="M0 120 C20 100, 40 80, 60 60 C80 40, 100 20, 120 0"
          stroke="#7D9B76"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          variants={pathVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        />
        
        {/* Leaf 1 */}
        <motion.path
          d="M30 90 C25 80, 35 75, 40 85 C35 90, 25 95, 30 90"
          stroke="#7D9B76"
          strokeWidth="1.5"
          fill="#7D9B76"
          fillOpacity="0.3"
          variants={pathVariants}
          initial="hidden"
          animate="visible"
          custom={1}
        />
        
        {/* Leaf 2 */}
        <motion.path
          d="M50 70 C45 60, 55 55, 60 65 C55 70, 45 75, 50 70"
          stroke="#7D9B76"
          strokeWidth="1.5"
          fill="#7D9B76"
          fillOpacity="0.3"
          variants={pathVariants}
          initial="hidden"
          animate="visible"
          custom={2}
        />
        
        {/* Small flower */}
        <motion.circle
          cx="70"
          cy="50"
          r="4"
          fill="#C1714F"
          fillOpacity="0.8"
          variants={pathVariants}
          initial="hidden"
          animate="visible"
          custom={3}
        />
        <motion.circle
          cx="70"
          cy="50"
          r="6"
          stroke="#C1714F"
          strokeWidth="1"
          fill="none"
          variants={pathVariants}
          initial="hidden"
          animate="visible"
          custom={3.5}
        />
        
        {/* Leaf 3 */}
        <motion.path
          d="M80 35 C75 25, 85 20, 90 30 C85 35, 75 40, 80 35"
          stroke="#7D9B76"
          strokeWidth="1.5"
          fill="#7D9B76"
          fillOpacity="0.3"
          variants={pathVariants}
          initial="hidden"
          animate="visible"
          custom={4}
        />
        
        {/* Small branch offshoot */}
        <motion.path
          d="M40 80 C30 70, 25 60, 20 50"
          stroke="#5C3D2E"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          variants={pathVariants}
          initial="hidden"
          animate="visible"
          custom={2}
        />
        
        {/* Tiny leaves on offshoot */}
        <motion.path
          d="M25 60 C20 55, 18 60, 22 65"
          stroke="#7D9B76"
          strokeWidth="1"
          fill="#7D9B76"
          fillOpacity="0.4"
          variants={pathVariants}
          initial="hidden"
          animate="visible"
          custom={3}
        />
        
        {/* Small berries */}
        <motion.circle
          cx="95"
          cy="25"
          r="3"
          fill="#C1714F"
          variants={pathVariants}
          initial="hidden"
          animate="visible"
          custom={5}
        />
        <motion.circle
          cx="100"
          cy="20"
          r="2"
          fill="#C1714F"
          fillOpacity="0.7"
          variants={pathVariants}
          initial="hidden"
          animate="visible"
          custom={5.5}
        />
      </svg>
    </div>
  )
}

export function CornerWreathSet({ className = '' }: { className?: string }) {
  return (
    <>
      <CornerWreath corner="top-left" className={className} />
      <CornerWreath corner="top-right" className={className} />
      <CornerWreath corner="bottom-left" className={className} />
      <CornerWreath corner="bottom-right" className={className} />
    </>
  )
}
