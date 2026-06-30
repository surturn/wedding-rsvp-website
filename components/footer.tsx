'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export function Footer() {
  const prefersReducedMotion = useReducedMotion()
  const pathname = usePathname()

  // Don't show footer on admin, usher, or confirm pages
  if (
    pathname === '/admin' ||
    pathname === '/usher' ||
    pathname.startsWith('/confirm/')
  ) return null
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: prefersReducedMotion ? 0 : 0.5 }}
      className="py-10 bg-brown text-warm-white/80"
    >
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="font-serif text-xl tracking-wide mb-2">
          Manuh &amp; Anne &middot; 2026
        </p>
        <p className="text-warm-white/60 text-sm italic">
          A love story written by God
        </p>
      </div>
    </motion.footer>
  )
}
