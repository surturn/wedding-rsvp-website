'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { Countdown } from '@/components/countdown'
import { HandSignIcon, HeartHandsIcon } from '@/components/hand-sign-icon'
import { LeafDecoration } from '@/components/leaf-decoration'
import { FallingPetals, CornerWreath, FloatingScriptureVerses, MobileScriptureVerses } from '@/components/florals'
import { HeroCouplePhoto, AboutCouplePhoto } from '@/components/couple-photo'
import { HowItBegan } from '@/components/how-it-began'
import PolaroidDump from '@/components/polaroid-dump'

export default function HomePage() {
  const prefersReducedMotion = useReducedMotion()

  // Guard scroll-based transforms until after hydration so SSR always
  // renders the static (reduced-motion) fallback, avoiding mismatch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const useScrollAnimations = mounted && !prefersReducedMotion

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.2,
        delayChildren: prefersReducedMotion ? 0 : 0.1
      }
    }
  }
  return (
    <div className="min-h-screen bg-cream">
      {/* Falling Petals — fewer on mobile for perf */}
      <FallingPetals count={24} />
      
      {/* ===================== HERO SECTION ===================== */}
      <section className="relative flex items-center justify-center overflow-hidden
        min-h-[100dvh] py-20 md:py-0 md:min-h-screen">
        
        {/* Corner wreaths — hidden on very small screens */}
        <div className="hidden sm:block">
          <CornerWreath corner="top-left" size={100} className="z-20" />
          <CornerWreath corner="bottom-right" size={100} className="z-20" />
        </div>
        
        {/* Leaf decorations — smaller on mobile, hidden on xs */}
        <LeafDecoration className="absolute top-0 left-0 w-24 sm:w-40 md:w-56 text-sage/20 md:text-sage/30" position="left" />
        <LeafDecoration className="absolute top-0 right-0 w-24 sm:w-40 md:w-56 text-sage/20 md:text-sage/30" position="right" />
        
        {/* Background texture */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%235C3D2E' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Floating Scripture Verses — desktop only */}
        <FloatingScriptureVerses />

        <motion.div 
          className="relative z-10 text-center px-4 sm:px-6 w-full max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* === MOBILE LAYOUT: stacked vertically === */}
          <div className="md:hidden flex flex-col items-center">
            {/* Photo — smaller on mobile */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 1 }}
              className="mb-4"
            >
              <HeroCouplePhoto />
            </motion.div>

            {/* Tagline */}
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.8 }}
              className="text-sage text-xs sm:text-sm tracking-widest uppercase mb-3"
            >
              A love story written by God
            </motion.p>

            {/* Mobile scripture verses */}
            <MobileScriptureVerses />

            {/* Names — smaller on mobile */}
            <motion.div variants={fadeInUp} transition={{ duration: 1 }} className="mt-4">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <HeartHandsIcon className="w-6 h-6 text-terracotta/60" />
                <h1 className="font-serif text-5xl sm:text-6xl text-brown tracking-wide">
                  Manuh
                </h1>
              </div>
              
              <div className="flex items-center justify-center gap-3 my-2">
                <div className="h-px w-14 sm:w-20 bg-terracotta/40" />
                <span className="font-serif text-xl sm:text-2xl text-terracotta">&amp;</span>
                <div className="h-px w-14 sm:w-20 bg-terracotta/40" />
              </div>

              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <h1 className="font-serif text-5xl sm:text-6xl text-brown tracking-wide">
                  Anne
                </h1>
                <HeartHandsIcon className="w-6 h-6 text-terracotta/60" />
              </div>
            </motion.div>

            {/* Last name */}
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.8 }}
              className="text-muted-foreground text-base mt-3 font-light tracking-widest uppercase"
            >
              James
            </motion.p>

            {/* Date */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.8 }}
              className="mt-6"
            >
              <p className="font-serif text-xl sm:text-2xl text-terracotta">
                September 5, 2026
              </p>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                CITAM Nakuru &bull; Nakuru, Kenya
              </p>
            </motion.div>

            {/* Countdown */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.8 }}
              className="mt-8"
            >
              <Countdown targetDate="2026-09-05T14:00:00" />
            </motion.div>

            {/* CTA */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.8 }}
              className="mt-8"
            >
              <Link
                href="/rsvp"
                className="inline-block px-8 py-3 bg-terracotta text-warm-white font-medium text-base rounded-md hover:bg-brown transition-colors shadow-lg shadow-terracotta/20"
              >
                RSVP Now
              </Link>
            </motion.div>
          </div>

          {/* === DESKTOP LAYOUT: photo + names side by side === */}
          <div className="hidden md:block">
            {/* Tagline */}
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.8 }}
              className="text-sage text-base tracking-widest uppercase mb-8"
            >
              A love story written by God
            </motion.p>

            {/* Photo + Names row */}
            <div className="flex items-center justify-center gap-12 lg:gap-16">
              <motion.div
                variants={fadeInUp}
                transition={{ duration: 1 }}
              >
                <HeroCouplePhoto />
              </motion.div>

              <motion.div variants={fadeInUp} transition={{ duration: 1 }}>
                <div className="flex items-center justify-center gap-6 mb-2">
                  <HeartHandsIcon className="w-12 h-12 text-terracotta/60" />
                  <h1 className="font-serif text-8xl lg:text-9xl text-brown tracking-wide">
                    Manuh
                  </h1>
                </div>
                
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="flex items-center justify-center gap-4 my-4"
                >
                  <div className="h-px w-32 bg-terracotta/40" />
                  <span className="font-serif text-3xl text-terracotta">&amp;</span>
                  <div className="h-px w-32 bg-terracotta/40" />
                </motion.div>

                <div className="flex items-center justify-center gap-6 mt-2">
                  <h1 className="font-serif text-8xl lg:text-9xl text-brown tracking-wide">
                    Anne
                  </h1>
                  <HeartHandsIcon className="w-12 h-12 text-terracotta/60" />
                </div>
              </motion.div>
            </div>

            {/* Last name */}
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.8 }}
              className="text-muted-foreground text-xl mt-6 font-light tracking-widest uppercase"
            >
              James
            </motion.p>

            {/* Date */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.8 }}
              className="mt-12"
            >
              <p className="font-serif text-4xl text-terracotta">
                September 5, 2026
              </p>
              <p className="text-muted-foreground mt-3 text-lg">
                CITAM Nakuru &bull; Nakuru, Kenya
              </p>
            </motion.div>

            {/* Countdown */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.8 }}
              className="mt-16"
            >
              <Countdown targetDate="2026-09-05T14:00:00" />
            </motion.div>

            {/* CTA */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.8 }}
              className="mt-14"
            >
              <Link
                href="/rsvp"
                className="inline-block px-10 py-4 bg-terracotta text-warm-white font-medium text-lg rounded-md hover:bg-brown transition-colors shadow-lg shadow-terracotta/20"
              >
                RSVP Now
              </Link>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-sage/60"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Bottom leaves — smaller on mobile */}
        <LeafDecoration className="absolute bottom-0 left-0 w-28 sm:w-48 md:w-72 text-sage/15 md:text-sage/20" position="bottom-left" />
        <LeafDecoration className="absolute bottom-0 right-0 w-28 sm:w-48 md:w-72 text-sage/15 md:text-sage/20" position="bottom-right" />
      </section>

      {/* ===================== HOW IT BEGAN MONTAGE ===================== */}
      <HowItBegan />

      {/* ===================== OUR STORY ===================== */}
      <PolaroidDump />

      {/* ===================== SCRIPTURE QUOTE ===================== */}
      <section className="py-14 md:py-28 bg-sage/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} transition={{ duration: 0.8 }}>
              <HandSignIcon className="w-10 h-10 md:w-12 md:h-12 mx-auto text-terracotta/50 mb-6 md:mb-8" />
            </motion.div>
            
            <motion.blockquote 
              variants={fadeInUp} 
              transition={{ duration: 0.8 }}
              className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl text-brown leading-relaxed italic"
            >
              &ldquo;Two are better than one, because they have a good return for their labor: 
              If either of them falls down, one can help the other up.&rdquo;
            </motion.blockquote>
            
            <motion.cite 
              variants={fadeInUp} 
              transition={{ duration: 0.8 }}
              className="block mt-6 md:mt-8 text-muted-foreground not-italic text-base md:text-lg"
            >
              — Ecclesiastes 4:9-10
            </motion.cite>
          </motion.div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="py-14 md:py-28 bg-cream">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.h3 
              variants={fadeInUp} 
              transition={{ duration: 0.8 }}
              className="font-serif text-2xl sm:text-3xl md:text-4xl text-brown mb-4 md:mb-6"
            >
              Join Us in Celebration
            </motion.h3>
            
            <motion.p 
              variants={fadeInUp} 
              transition={{ duration: 0.8 }}
              className="text-muted-foreground text-base md:text-lg mb-8 md:mb-10 leading-relaxed"
            >
              We would be honored to have you witness the beginning of our new chapter. 
              Please let us know if you can attend.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp} 
              transition={{ duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            >
              <Link
                href="/rsvp"
                className="w-full sm:w-auto px-8 py-3 bg-terracotta text-warm-white font-medium rounded-md hover:bg-brown transition-colors shadow-lg shadow-terracotta/20 text-center"
              >
                RSVP Now
              </Link>
              <Link
                href="/details"
                className="w-full sm:w-auto px-8 py-3 border-2 border-sage text-sage font-medium rounded-md hover:bg-sage hover:text-warm-white transition-colors text-center"
              >
                View Details
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
