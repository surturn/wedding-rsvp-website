'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'

/** Animated SVG floral wreath that draws in on load */
function FloralWreath() {
  const prefersReducedMotion = useReducedMotion()

  // Generate leaf positions around a circle
  const leaves = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2
    const r = 130
    const cx = Math.round((150 + Math.cos(angle) * r) * 1e4) / 1e4
    const cy = Math.round((150 + Math.sin(angle) * r) * 1e4) / 1e4
    const rotation = Math.round(((angle * 180) / Math.PI + 90) * 1e4) / 1e4
    return { cx, cy, rotation, delay: i * 0.08 }
  })

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 300 300"
      fill="none"
    >
      {/* Wreath circle path */}
      <motion.circle
        cx="150"
        cy="150"
        r="130"
        stroke="#7D9B76"
        strokeWidth="1"
        strokeOpacity="0.3"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 2,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />

      {/* Leaves around the wreath */}
      {leaves.map((leaf, i) => (
        <motion.g
          key={i}
          transform={`translate(${leaf.cx}, ${leaf.cy}) rotate(${leaf.rotation})`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.4,
            delay: prefersReducedMotion ? 0 : 0.8 + leaf.delay,
            ease: 'easeOut',
          }}
        >
          {/* Leaf shape */}
          <path
            d="M0,-12 C4,-8 5,-2 0,4 C-5,-2 -4,-8 0,-12Z"
            fill="#7D9B76"
            fillOpacity={0.35 + (i % 3) * 0.1}
          />
          {/* Tiny berry / flower dot on some leaves */}
          {i % 4 === 0 && (
            <circle
              cx={i % 2 === 0 ? 4 : -4}
              cy={-2}
              r="2"
              fill="#C1714F"
              fillOpacity="0.5"
            />
          )}
        </motion.g>
      ))}

      {/* Small flowers at cardinal points */}
      {[0, 90, 180, 270].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const cx = Math.round((150 + Math.cos(rad) * 130) * 1e4) / 1e4
        const cy = Math.round((150 + Math.sin(rad) * 130) * 1e4) / 1e4
        return (
          <motion.g
            key={`flower-${i}`}
            transform={`translate(${cx}, ${cy})`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.5,
              delay: prefersReducedMotion ? 0 : 2 + i * 0.15,
              ease: 'backOut',
            }}
          >
            {/* 5-petal flower */}
            {[0, 72, 144, 216, 288].map((pAngle) => (
              <ellipse
                key={pAngle}
                cx={Math.round(Math.cos((pAngle * Math.PI) / 180) * 5 * 1e4) / 1e4}
                cy={Math.round(Math.sin((pAngle * Math.PI) / 180) * 5 * 1e4) / 1e4}
                rx="3"
                ry="4.5"
                fill="#C1714F"
                fillOpacity="0.4"
                transform={`rotate(${pAngle})`}
              />
            ))}
            <circle r="2.5" fill="#5C3D2E" fillOpacity="0.4" />
          </motion.g>
        )
      })}
    </svg>
  )
}

/** Initials placeholder when photo is unavailable */
function InitialsPlaceholder({ size }: { size: 'hero' | 'about' }) {
  const dim = size === 'hero' ? 'w-full h-full' : 'w-full h-full'
  return (
    <div className={`${dim} flex items-center justify-center bg-gradient-to-br from-[#e8d5c4] to-[#d4b8a0]`}>
      <span className="font-serif text-terracotta/70 select-none"
        style={{ fontSize: size === 'hero' ? '3rem' : '1.5rem' }}
      >
        M &amp; A
      </span>
    </div>
  )
}

/** 
 * Hero couple photo — large circular frame with animated floral wreath.
 * Desktop: side-by-side with names. Mobile: centered above names.
 */
export function HeroCouplePhoto() {
  const [imgError, setImgError] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className="relative flex-shrink-0"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0.3 : 1,
        delay: 0.2,
        ease: 'easeOut',
      }}
    >
      {/* Wreath container — sized to surround the photo */}
      <div className="relative w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80">
        {/* Animated floral wreath SVG */}
        <FloralWreath />

        {/* Double-border frame */}
        <div className="absolute inset-[14px] sm:inset-[18px] md:inset-[20px] rounded-full overflow-hidden
          ring-2 sm:ring-[3px] ring-cream ring-offset-2 sm:ring-offset-[3px] ring-offset-terracotta/70
          shadow-xl shadow-brown/15"
        >
          {/* Sepia overlay */}
          <div className="absolute inset-0 z-10 mix-blend-multiply bg-[#d4a574] opacity-[0.12] pointer-events-none" />
          
          {imgError ? (
            <InitialsPlaceholder size="hero" />
          ) : (
            <Image
              src="/images/couple.jpg"
              alt="Manuh and Anne — a love story written by God"
              fill
              className="object-cover object-top"
              priority
              loading="eager"
              onError={() => setImgError(true)}
              sizes="(max-width: 768px) 224px, (max-width: 1024px) 288px, 320px"
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * About section couple photo — polaroid/paper style, tilted.
 * Caption: "Zambia, 2023 — the month that changed everything"
 */
export function AboutCouplePhoto() {
  const [imgError, setImgError] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className="relative inline-block"
      initial={{ opacity: 0, rotate: 0, y: 30 }}
      whileInView={{ opacity: 1, rotate: -3, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: prefersReducedMotion ? 0.3 : 0.8,
        ease: 'easeOut',
      }}
      whileHover={{
        rotate: 0,
        scale: 1.02,
        transition: { duration: 0.3 },
      }}
    >
      {/* Polaroid frame */}
      <div
        className="bg-warm-white p-3 pb-14 md:p-4 md:pb-16 rounded-sm
          shadow-xl shadow-brown/15"
        style={{
          background: 'linear-gradient(135deg, #FFFDF9 0%, #f7f0e6 100%)',
        }}
      >
        {/* Photo area */}
        <div className="relative w-48 h-56 sm:w-56 sm:h-64 md:w-72 md:h-80 overflow-hidden">
          {/* Subtle warm overlay */}
          <div className="absolute inset-0 z-10 bg-[#d4a574] opacity-[0.06] pointer-events-none" />
          
          {imgError ? (
            <InitialsPlaceholder size="about" />
          ) : (
            <Image
              src="/images/couple.jpg"
              alt="Manuh and Anne in Zambia"
              fill
              className="object-cover object-top"
              onError={() => setImgError(true)}
              sizes="(max-width: 768px) 224px, 288px"
            />
          )}
        </div>

        {/* Caption — handwritten style */}
        <p className="absolute bottom-4 md:bottom-5 left-0 right-0 text-center
          font-serif italic text-sm md:text-base text-brown/60 px-4">
          Zambia, 2023 — the month that changed everything
        </p>
      </div>

      {/* Tape effect at top */}
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 rounded-sm opacity-30"
        style={{
          background: 'linear-gradient(135deg, #e8d5c4 0%, #d4c4b0 100%)',
        }}
      />
    </motion.div>
  )
}
