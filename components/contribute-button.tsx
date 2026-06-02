'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export function ContributeButton() {
  return (
    <Link href="/contribute">
      <motion.button
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-terracotta text-warm-white rounded-full shadow-lg hover:bg-terracotta/90 transition-colors group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        aria-label="Contribute"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <Heart className="w-6 h-6 fill-current" />
        </motion.div>
      </motion.button>
    </Link>
  )
}
