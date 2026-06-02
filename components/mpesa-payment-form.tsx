'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Loader2, AlertCircle } from 'lucide-react'

type FormState = 'idle' | 'loading' | 'error'

const PRESET_AMOUNTS = [500, 1000, 2000, 5000]

interface MpesaPaymentFormProps {
  onPaymentInitiated: (checkoutRequestId: string) => void
}

export function MpesaPaymentForm({ onPaymentInitiated }: MpesaPaymentFormProps) {
  const prefersReducedMotion = useReducedMotion()

  const [formData, setFormData] = useState({
    guestName: '',
    phoneNumber: '',
    amount: '',
    message: '',
  })
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Strip spaces, dashes, and plus signs
    let rawValue = e.target.value.replace(/[\s\-+]/g, '');
    
    // 2. Strip leading zero and replace with '254'
    if (rawValue.startsWith('0')) {
      rawValue = '254' + rawValue.slice(1);
    }
    
    // 3. Remove any non-numeric characters that might have slipped through
    rawValue = rawValue.replace(/\D/g, '');

    // 4. Limit to 12 digits (in case they paste a very long number)
    if (rawValue.length > 12) {
      rawValue = rawValue.slice(0, 12);
    }

    setFormData({ ...formData, phoneNumber: rawValue });
  }

  const handlePresetSelect = (amount: number) => {
    if (selectedPreset === amount) {
      // Deselect
      setSelectedPreset(null)
      setFormData({ ...formData, amount: '' })
    } else {
      setSelectedPreset(amount)
      setFormData({ ...formData, amount: String(amount) })
    }
  }

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    setSelectedPreset(null)
    setFormData({ ...formData, amount: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState('loading')
    setErrorMessage('')

    const amount = parseInt(formData.amount)
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
      const response = await fetch('/api/payments/stk-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
          amount,
          guestName: formData.guestName,
          message: formData.message,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate payment')
      }

      onPaymentInitiated(data.checkoutRequestId)
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
      {/* Error Banner */}
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
              <p className="font-medium text-destructive">Payment Error</p>
              <p className="text-sm text-destructive/80">{errorMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guest Name */}
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

      {/* Phone Number */}
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
          Enter the number registered with M-Pesa
        </p>
      </motion.div>

      {/* Amount - Preset Buttons */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-brown mb-3">
          Gift Amount (KES) <span className="text-terracotta">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {PRESET_AMOUNTS.map((amount) => (
            <motion.button
              key={amount}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePresetSelect(amount)}
              className={`flex items-center justify-center px-4 py-4 border-2 rounded-md cursor-pointer transition-all font-medium ${
                selectedPreset === amount
                  ? 'border-terracotta bg-terracotta/10 text-terracotta'
                  : 'border-border hover:border-terracotta/50 text-muted-foreground'
              }`}
            >
              {amount.toLocaleString()}
            </motion.button>
          ))}
        </div>

        {/* Custom Amount Input */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            KES
          </span>
          <motion.input
            variants={inputFocusVariants}
            initial="rest"
            whileFocus="focus"
            type="text"
            inputMode="numeric"
            value={selectedPreset ? '' : formData.amount}
            onChange={handleCustomAmountChange}
            onFocus={() => {
              if (selectedPreset) {
                setSelectedPreset(null)
                setFormData({ ...formData, amount: '' })
              }
            }}
            className="w-full pl-14 pr-4 py-3 border border-border rounded-md bg-cream/50 focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta transition-all duration-200"
            placeholder="Or enter custom amount"
          />
        </div>
      </motion.div>

      {/* Message */}
      <motion.div variants={itemVariants}>
        <label htmlFor="giftMessage" className="block text-sm font-medium text-brown mb-2">
          Message to the Couple
        </label>
        <motion.textarea
          variants={inputFocusVariants}
          initial="rest"
          whileFocus="focus"
          id="giftMessage"
          rows={3}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-4 py-3 border border-border rounded-md bg-cream/50 focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta transition-all duration-200 resize-none"
          placeholder="Share your blessings or well wishes..."
        />
      </motion.div>

      {/* Submit Button */}
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
              <span>Sending to M-Pesa...</span>
            </>
          ) : (
            <span>Send Gift via M-Pesa</span>
          )}
        </motion.button>
      </motion.div>

      {/* Security Note */}
      <motion.p
        variants={itemVariants}
        className="text-xs text-center text-muted-foreground"
      >
        You&apos;ll receive an M-Pesa prompt on your phone to confirm the payment.
      </motion.p>
    </motion.form>
  )
}
