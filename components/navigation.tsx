'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { Menu, X, Heart } from 'lucide-react'
import { HandSignIcon } from './hand-sign-icon'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/details', label: 'Details' },
  { href: '/rsvp', label: 'RSVP' },
]

export function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  // Don't show navigation on admin, usher, or confirm pages
  if (
    pathname === '/admin' ||
    pathname === '/usher' ||
    pathname.startsWith('/confirm/')
  ) return null

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-warm-white/90 backdrop-blur-sm border-b border-border"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Names with subtle hand motif */}
          <Link href="/" className="flex items-center gap-2 group">
            <HandSignIcon className="w-6 h-6 text-terracotta opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="font-serif text-xl text-brown">M & A</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative group"
              >
                <span className={`text-sm tracking-wide transition-colors flex items-center gap-1 ${
                  pathname === item.href 
                    ? 'text-terracotta font-medium' 
                    : 'text-brown hover:text-terracotta'
                }`}>
                  {'icon' in item && item.icon && <item.icon className="w-3.5 h-3.5" />}
                  {item.label}
                </span>
                {pathname === item.href && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-terracotta"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-brown p-2"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pt-4 pb-2"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block py-3 text-center transition-colors ${
                  pathname === item.href 
                    ? 'text-terracotta font-medium' 
                    : 'text-brown'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}
