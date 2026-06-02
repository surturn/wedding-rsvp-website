'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { HandSignIcon } from '@/components/hand-sign-icon'
import { SimpleLeaf } from '@/components/leaf-decoration'
import { MpesaPaymentForm } from '@/components/mpesa-payment-form'
import { MpesaPaymentStatus } from '@/components/mpesa-payment-status'

type PageView = 'form' | 'status'

export default function ContributePage() {
  const [view, setView] = useState<PageView>('form')
  const [checkoutRequestId, setCheckoutRequestId] = useState('')

  const handlePaymentInitiated = (id: string) => {
    setCheckoutRequestId(id)
    setView('status')
  }

  const handleReset = () => {
    setCheckoutRequestId('')
    setView('form')
  }

  return (
    <div className="min-h-screen bg-cream pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <SimpleLeaf className="w-6 h-6 text-sage/60 rotate-[-30deg]" />
            <HandSignIcon className="w-8 h-8 text-terracotta/70" />
            <SimpleLeaf className="w-6 h-6 text-sage/60 rotate-[30deg] scale-x-[-1]" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-brown mb-4">
            Gift the Couple
          </h1>
          <p className="text-muted-foreground mb-6">
            Bless Manuh &amp; Anne with a gift via M-Pesa
          </p>
          <div className="flex justify-center">
            <Link 
              href="/pledges" 
              className="text-terracotta hover:text-terracotta/80 text-sm font-medium underline underline-offset-4 transition-colors"
            >
              Or, make a Pledge (Lipa mdogo mdogo)
            </Link>
          </div>
        </motion.div>

        {/* Content — Form or Status */}
        <AnimatePresence mode="wait">
          {view === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MpesaPaymentForm onPaymentInitiated={handlePaymentInitiated} />
            </motion.div>
          )}

          {view === 'status' && (
            <motion.div
              key="status"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MpesaPaymentStatus
                checkoutRequestId={checkoutRequestId}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-muted-foreground mt-8 italic"
        >
          &ldquo;Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.&rdquo; — 2 Corinthians 9:7
        </motion.p>
      </div>
    </div>
  )
}
