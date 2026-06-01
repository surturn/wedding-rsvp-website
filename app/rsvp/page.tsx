'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { HandSignIcon } from '@/components/hand-sign-icon'
import { SimpleLeaf } from '@/components/leaf-decoration'
import { Check, Loader2, AlertCircle } from 'lucide-react'

type FormState = 'idle' | 'loading' | 'success' | 'error'

export default function RSVPPage() {
  const prefersReducedMotion = useReducedMotion()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    attending: true,
    companyCount: '',
  })
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          attending: formData.attending,
          guestCount: formData.attending ? 1 + (parseInt(formData.companyCount) || 0) : 0,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit RSVP')
      }

      setFormState('success')
    } catch {
      setFormState('error')
      setErrorMessage('Something went wrong. Please try again or contact the couple directly.')
    }
  }

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

    setFormData({ ...formData, phone: rawValue });
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

  // Success state
  if (formState === 'success') {
    return (
      <div className="min-h-screen bg-cream pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="bg-warm-white rounded-lg shadow-lg p-8 md:p-12 text-center"
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
              {formData.attending ? 'We Can\'t Wait to See You!' : 'Thank You for Letting Us Know'}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-2 text-lg"
            >
              {formData.attending
                ? 'Your RSVP has been received. We\'re so grateful you\'ll be joining us on our special day!'
                : 'We\'ll miss you, but we\'re thankful for your warm wishes. You\'ll be in our hearts.'}
            </motion.p>
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
        </div>
      </div>
    )
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
            Kindly Respond
          </h1>
          <p className="text-muted-foreground">
            Please let us know if you&apos;ll be joining us to celebrate
          </p>
          <p className="text-sm text-sage mt-2 italic">
            RSVP by August 21, 2026
          </p>
        </motion.div>

        {/* Form */}
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
                  <p className="font-medium text-destructive">Unable to submit RSVP</p>
                  <p className="text-sm text-destructive/80">{errorMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Name */}
          <motion.div variants={itemVariants}>
            <label htmlFor="name" className="block text-sm font-medium text-brown mb-2">
              Full Name <span className="text-terracotta">*</span>
            </label>
            <motion.input
              variants={inputFocusVariants}
              initial="rest"
              whileFocus="focus"
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-md bg-cream/50 focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta transition-all duration-200"
              placeholder="Your full name"
            />
          </motion.div>

          {/* Email */}
          <motion.div variants={itemVariants}>
            <label htmlFor="email" className="block text-sm font-medium text-brown mb-2">
              Email Address <span className="text-terracotta">*</span>
            </label>
            <motion.input
              variants={inputFocusVariants}
              initial="rest"
              whileFocus="focus"
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-md bg-cream/50 focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta transition-all duration-200"
              placeholder="you@example.com"
            />
          </motion.div>

          {/* Phone */}
          <motion.div variants={itemVariants}>
            <label htmlFor="phone" className="block text-sm font-medium text-brown mb-2">
              Phone Number <span className="text-terracotta">*</span>
            </label>
            <motion.input
              variants={inputFocusVariants}
              initial="rest"
              whileFocus="focus"
              type="tel"
              id="phone"
              required
              maxLength={12}
              value={formData.phone}
              onChange={handlePhoneChange}
              className="w-full px-4 py-3 border border-border rounded-md bg-cream/50 focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta transition-all duration-200"
              placeholder="254700000000"
            />
          </motion.div>

          {/* Attending Toggle */}
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-brown mb-3">
              Will you be attending? <span className="text-terracotta">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.label
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 flex items-center justify-center px-4 py-4 border-2 rounded-md cursor-pointer transition-all ${
                  formData.attending
                    ? 'border-terracotta bg-terracotta/10 text-terracotta'
                    : 'border-border hover:border-terracotta/50 text-muted-foreground'
                }`}
              >
                <input
                  type="radio"
                  name="attending"
                  checked={formData.attending}
                  onChange={() => setFormData({ ...formData, attending: true })}
                  className="sr-only"
                />
                <span className="font-medium">Joyfully Accept</span>
              </motion.label>
              <motion.label
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 flex items-center justify-center px-4 py-4 border-2 rounded-md cursor-pointer transition-all ${
                  !formData.attending
                    ? 'border-terracotta bg-terracotta/10 text-terracotta'
                    : 'border-border hover:border-terracotta/50 text-muted-foreground'
                }`}
              >
                <input
                  type="radio"
                  name="attending"
                  checked={!formData.attending}
                  onChange={() => setFormData({ ...formData, attending: false })}
                  className="sr-only"
                />
                <span className="font-medium">Regretfully Decline</span>
              </motion.label>
            </div>
          </motion.div>

          {/* Guest Count - Only shown when attending */}
          <AnimatePresence>
            {formData.attending && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label htmlFor="companyCount" className="block text-sm font-medium text-brown mb-2">
                  How many are you bringing for company?
                </label>
                <motion.input
                  variants={inputFocusVariants}
                  initial="rest"
                  whileFocus="focus"
                  type="number"
                  id="companyCount"
                  min={0}
                  max={9}
                  placeholder="0"
                  value={formData.companyCount}
                  onChange={(e) => setFormData({ ...formData, companyCount: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-md bg-cream/50 focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta transition-all duration-200"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message */}
          <motion.div variants={itemVariants}>
            <label htmlFor="message" className="block text-sm font-medium text-brown mb-2">
              Message / Note to the Couple
            </label>
            <motion.textarea
              variants={inputFocusVariants}
              initial="rest"
              whileFocus="focus"
              id="message"
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-md bg-cream/50 focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta transition-all duration-200 resize-none"
              placeholder="Share your well wishes or a special note..."
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
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit RSVP</span>
              )}
            </motion.button>
          </motion.div>
        </motion.form>

        {/* Footer Quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-muted-foreground mt-8 italic"
        >
          &ldquo;Let us not love with words or speech but with actions and in truth.&rdquo; — 1 John 3:18
        </motion.p>
      </div>
    </div>
  )
}
