'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HandSignIcon } from '@/components/hand-sign-icon'
import { SimpleLeaf } from '@/components/leaf-decoration'
import { PledgeForm } from '@/components/pledge-form'
import { PledgeProgress, PledgeData } from '@/components/pledge-progress'
import { MpesaPaymentForm } from '@/components/mpesa-payment-form'
import { MpesaPaymentStatus } from '@/components/mpesa-payment-status'
import { Loader2, Search } from 'lucide-react'

type ViewState = 'lookup' | 'progress' | 'create' | 'payment' | 'status'

export default function PledgesPage() {
  const [view, setView] = useState<ViewState>('lookup')
  const [phoneQuery, setPhoneQuery] = useState('')
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [pledgeData, setPledgeData] = useState<PledgeData | null>(null)
  const [checkoutRequestId, setCheckoutRequestId] = useState('')

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/[\s\-+]/g, '')
    if (rawValue.startsWith('0')) {
      rawValue = '254' + rawValue.slice(1)
    }
    rawValue = rawValue.replace(/\D/g, '')
    if (rawValue.length > 12) {
      rawValue = rawValue.slice(0, 12)
    }
    setPhoneQuery(rawValue)
  }

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLookupError('')
    
    if (phoneQuery.length < 12) {
      setLookupError('Please enter a valid phone number')
      return
    }

    setIsLookingUp(true)
    try {
      const res = await fetch(`/api/pledges?phone=${phoneQuery}`)
      if (!res.ok) {
        if (res.status === 404) {
          // No pledge found -> prompt to create one
          setView('create')
        } else {
          const data = await res.json()
          setLookupError(data.error || 'Failed to lookup pledge')
        }
      } else {
        const data = await res.json()
        setPledgeData(data.pledge || data)
        setView('progress')
      }
    } catch (err) {
      setLookupError('An error occurred while looking up your pledge.')
    } finally {
      setIsLookingUp(false)
    }
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
            Your Wedding Pledge
          </h1>
          <p className="text-muted-foreground mb-6">
            Lipa mdogo mdogo towards your promised gift
          </p>
        </motion.div>

        {/* State Machine Views */}
        <AnimatePresence mode="wait">
          {view === 'lookup' && (
            <motion.form
              key="lookup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleLookup}
              className="bg-warm-white rounded-lg shadow-lg p-6 md:p-8 space-y-6"
            >
              <div>
                <label htmlFor="lookupPhone" className="block text-sm font-medium text-brown mb-2">
                  Enter your phone number to find your pledge
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    id="lookupPhone"
                    value={phoneQuery}
                    onChange={handlePhoneChange}
                    className="w-full pl-4 pr-12 py-3 border border-border rounded-md bg-cream/50 focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta transition-all duration-200"
                    placeholder="254700000000"
                  />
                  <button
                    type="submit"
                    disabled={isLookingUp}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-terracotta hover:bg-terracotta/10 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isLookingUp ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>
                {lookupError && <p className="text-destructive text-sm mt-2">{lookupError}</p>}
              </div>

              <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">Don&apos;t have a pledge yet?</p>
                <button
                  type="button"
                  onClick={() => setView('create')}
                  className="text-terracotta font-medium hover:underline underline-offset-4"
                >
                  Create a New Pledge
                </button>
              </div>
            </motion.form>
          )}

          {view === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PledgeForm onPledgeCreated={(pledge) => {
                setPledgeData(pledge)
                setView('progress')
              }} />
              <div className="mt-6 text-center">
                <button
                  onClick={() => setView('lookup')}
                  className="text-sm text-muted-foreground hover:text-brown transition-colors"
                >
                  &larr; Back to lookup
                </button>
              </div>
            </motion.div>
          )}

          {view === 'progress' && pledgeData && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PledgeProgress 
                pledge={pledgeData} 
                onMakePayment={() => setView('payment')} 
              />
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setView('lookup')
                    setPledgeData(null)
                    setPhoneQuery('')
                  }}
                  className="text-sm text-muted-foreground hover:text-brown transition-colors"
                >
                  &larr; Lookup a different pledge
                </button>
              </div>
            </motion.div>
          )}

          {view === 'payment' && pledgeData && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MpesaPaymentForm
                defaultName={pledgeData.GuestName}
                defaultPhone={pledgeData.PhoneNumber}
                readOnlyPhone={true}
                onPaymentInitiated={(id) => {
                  setCheckoutRequestId(id)
                  setView('status')
                }}
              />
              <div className="mt-6 text-center">
                <button
                  onClick={() => setView('progress')}
                  className="text-sm text-muted-foreground hover:text-brown transition-colors"
                >
                  &larr; Back to pledge progress
                </button>
              </div>
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
                onReset={() => setView('progress')} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
