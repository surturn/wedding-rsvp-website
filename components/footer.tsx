'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { HandSignIcon } from './hand-sign-icon'

export function Footer() {
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: prefersReducedMotion ? 0 : 0.5 }}
      className="py-10 bg-brown text-warm-white/80"
    >
      <div className="max-w-6xl mx-auto px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-lg" role="img" aria-label="Hand sign for I love you">
            &#x1F91F;
          </span>
        </div>
        <p className="font-serif text-xl tracking-wide mb-2">
          Manuh &amp; Anne &middot; 2025
        </p>
        <p className="text-warm-white/60 text-sm italic">
          A love story written by God
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-warm-white/40 text-xs">
          <HandSignIcon className="w-4 h-4" />
          <span>Speaking love in words and signs</span>
          <HandSignIcon className="w-4 h-4" />
        </div>
      </div>
    </motion.footer>
  )
}
