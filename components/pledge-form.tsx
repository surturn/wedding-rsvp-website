'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Loader2, AlertCircle } from 'lucide-react'

interface PledgeData {
  GuestName: string
  PhoneNumber: string
  PledgedAmount: number
  AmountPaid: number
  Status: string
}

interface PledgeFormProps {
  onPledgeCreated: (pledge: PledgeData) => void
}

export function PledgeForm({ onPledgeCreated }: PledgeFormProps) {
  const prefersReducedMotion = useReducedMotion()

  const [formData, setFormData] = useState({
    guestName: '',
    phoneNumber: '',
    pledgedAmount: '',
  })
  const [formState, setFormState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/[\s\-+]/g, '')
    if (rawValue.startsWith('0')) {
      rawValue = '254' + rawValue.slice(1)
    }
    rawValue = rawValue.replace(/\D/g, '')
    if (rawValue.length > 12) {
      rawValue = rawValue.slice(0, 12)
    }
    setFormData({ ...formData, phoneNumber: rawValue })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState('loading')
    setErrorMessage('')

    const amount = parseInt(formData.pledgedAmount)
    if (!amount || amount < 1) {
      setFormState('error')
      setErrorMessage('Please enter a valid amount.')
      return
    }

    if (formData.phoneNumber.length < 12 || !formData.phoneNumber.startsWith('254')) {
      setFormState('error')
      setErrorMessage('Please enter a valid Kenyan phone number (254XXXXXXXXX).')
      return
    }

    try {
      const response = await fetch('/api/pledges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestName: formData.guestName,
          phoneNumber: formData.phoneNumber,
          pledgedAmount: amount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create pledge')
      }

      onPledgeCreated(data.pledge || data) // handle both wrapped or unwrapped response
    } catch (err) {
      setFormState('error')
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      )
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const inputFocusVariants = {
    rest: { scale: 1 },
    focus: { scale: prefersReducedMotion ? 1 : 1.01, transition: { duration: 0.2 } },
  }

  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className="bg-warm-white rounded-lg shadow-lg p-6 md:p-8 space-y-6"
    >
      <AnimatePresence>
        {formState === 'error' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-destructive/10 border border-destructive/30 rounded-md p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80">{errorMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants}>
        <label htmlFor="guestName" className="block text-sm font-medium text-brown mb-2">
          Your Name <span className="text-terracotta">*</span>
        </label>
        <motion.input
          variants={inputFocusVariants}
          initial="rest"
          whileFocus="focus"
          type="text"
          id="guestName"
          required
          value={formData.guestName}
          onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
          className="w-full px-4 py-3 border border-border rounded-md bg-cream/50 focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta transition-all duration-200"
          placeholder="Your full name"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-brown mb-2">
          M-Pesa Phone Number <span className="text-terracotta">*</span>
        </label>
        <motion.input
          variants={inputFocusVariants}
          initial="rest"
          whileFocus="focus"
          type="tel"
          id="phoneNumber"
          required
          maxLength={12}
          value={formData.phoneNumber}
          onChange={handlePhoneChange}
          className="w-full px-4 py-3 border border-border rounded-md bg-cream/50 focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta transition-all duration-200"
          placeholder="254700000000"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Enter the number registered with M-Pesa. This will be used to track your pledge.
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <label htmlFor="pledgedAmount" className="block text-sm font-medium text-brown mb-2">
          Pledged Amount (KES) <span className="text-terracotta">*</span>
        </label>
        <motion.input
          variants={inputFocusVariants}
          initial="rest"
          whileFocus="focus"
          type="text"
          id="pledgedAmount"
          inputMode="numeric"
          required
          value={formData.pledgedAmount}
          onChange={(e) => setFormData({ ...formData, pledgedAmount: e.target.value.replace(/\D/g, '') })}
          className="w-full px-4 py-3 border border-border rounded-md bg-cream/50 focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta transition-all duration-200"
          placeholder="e.g. 5000"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <motion.button
          type="submit"
          disabled={formState === 'loading'}
          whileHover={{ scale: formState === 'loading' ? 1 : 1.02 }}
          whileTap={{ scale: formState === 'loading' ? 1 : 0.98 }}
          className="w-full py-4 bg-terracotta text-warm-white font-medium rounded-md hover:bg-terracotta/90 transition-colors shadow-lg shadow-terracotta/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {formState === 'loading' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creating Pledge...</span>
            </>
          ) : (
            <span>Create Pledge</span>
          )}
        </motion.button>
      </motion.div>
    </motion.form>
  )
}
