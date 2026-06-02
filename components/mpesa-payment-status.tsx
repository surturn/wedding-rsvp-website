'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Check, AlertCircle, Smartphone } from 'lucide-react'
import { HandSignIcon } from '@/components/hand-sign-icon'

type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT'

interface MpesaPaymentStatusProps {
  checkoutRequestId: string
  onReset: () => void
}

export function MpesaPaymentStatus({ checkoutRequestId, onReset }: MpesaPaymentStatusProps) {
  const prefersReducedMotion = useReducedMotion()
  const [status, setStatus] = useState<PaymentStatus>('PENDING')
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null)
  const [errorDescription, setErrorDescription] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const TIMEOUT_MS = 120_000 // 2 minutes
  const POLL_INTERVAL_MS = 4_000 // 4 seconds

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const pollStatus = useCallback(async () => {
    // Check for timeout
    if (Date.now() - startTimeRef.current > TIMEOUT_MS) {
      stopPolling()
      setStatus('TIMEOUT')
      return
    }

    try {
      const response = await fetch(`/api/payments/status/${checkoutRequestId}`)
      const data = await response.json()

      if (data.status === 'COMPLETED') {
        stopPolling()
        setStatus('COMPLETED')
        setReceiptNumber(data.mpesaReceiptNumber || null)
      } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
        stopPolling()
        setStatus('FAILED')
        setErrorDescription(data.resultDesc || 'The payment was cancelled or failed.')
      }
      // If still PENDING, keep polling
    } catch {
      // Silently handle network errors during polling — will retry next interval
    }
  }, [checkoutRequestId, stopPolling])

  useEffect(() => {
    // Start polling immediately
    pollStatus()
    intervalRef.current = setInterval(pollStatus, POLL_INTERVAL_MS)

    return () => {
      stopPolling()
    }
  }, [pollStatus, stopPolling])

  return (
    <div className="bg-warm-white rounded-lg shadow-lg p-8 md:p-12">
      <AnimatePresence mode="wait">
        {/* PENDING State */}
        {status === 'PENDING' && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="text-center"
          >
            {/* Pulsing phone icon */}
            <motion.div
              animate={prefersReducedMotion ? {} : {
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-20 h-20 bg-terracotta/15 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Smartphone className="w-10 h-10 text-terracotta" />
            </motion.div>

            <h2 className="font-serif text-3xl md:text-4xl text-brown mb-4">
              Check Your Phone
            </h2>
            <p className="text-muted-foreground mb-2 text-lg">
              Enter your M-Pesa PIN to complete the payment
            </p>
            <p className="text-sm text-muted-foreground">
              A prompt has been sent to your phone. Please check and confirm.
            </p>

            {/* Subtle progress indicator */}
            <div className="mt-8 max-w-xs mx-auto">
              <div className="h-1 bg-cream rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-terracotta/40 rounded-full"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ width: '40%' }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* COMPLETED State */}
        {status === 'COMPLETED' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-10 h-10 text-sage" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-serif text-3xl md:text-4xl text-brown mb-4"
            >
              Thank You for Your Generous Gift!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-2 text-lg"
            >
              Your blessing means the world to us. May God multiply your kindness.
            </motion.p>

            {receiptNumber && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="mt-4 inline-block bg-sage/10 border border-sage/20 rounded-md px-4 py-2"
              >
                <p className="text-sm text-muted-foreground">
                  M-Pesa Receipt: <span className="font-medium text-brown">{receiptNumber}</span>
                </p>
              </motion.div>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground italic mt-6"
            >
              &ldquo;Every good and perfect gift is from above&rdquo; — James 1:17
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <HandSignIcon className="w-10 h-10 text-terracotta/50 mx-auto mt-6" />
            </motion.div>
          </motion.div>
        )}

        {/* FAILED State */}
        {status === 'FAILED' && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <AlertCircle className="w-10 h-10 text-destructive" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-serif text-3xl md:text-4xl text-brown mb-4"
            >
              Payment Not Completed
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-6 text-lg"
            >
              {errorDescription || 'The payment could not be processed.'}
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReset}
              className="px-8 py-4 bg-terracotta text-warm-white font-medium rounded-md hover:bg-terracotta/90 transition-colors shadow-lg shadow-terracotta/20"
            >
              Try Again
            </motion.button>
          </motion.div>
        )}

        {/* TIMEOUT State */}
        {status === 'TIMEOUT' && (
          <motion.div
            key="timeout"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-terracotta/15 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Smartphone className="w-10 h-10 text-terracotta" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-serif text-3xl md:text-4xl text-brown mb-4"
            >
              Request Timed Out
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-6 text-lg"
            >
              We didn&apos;t receive a response in time. The M-Pesa prompt may have expired.
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReset}
              className="px-8 py-4 bg-terracotta text-warm-white font-medium rounded-md hover:bg-terracotta/90 transition-colors shadow-lg shadow-terracotta/20"
            >
              Try Again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
