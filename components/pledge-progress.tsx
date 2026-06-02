'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, ChevronRight, Clock } from 'lucide-react'

export interface PledgeData {
  GuestName: string
  PhoneNumber: string
  PledgedAmount: number
  AmountPaid: number
  Status: string
}

interface PledgeProgressProps {
  pledge: PledgeData
  onMakePayment: () => void
}

export function PledgeProgress({ pledge, onMakePayment }: PledgeProgressProps) {
  const { GuestName, PledgedAmount, AmountPaid, Status } = pledge

  const percentage = Math.min(Math.round((AmountPaid / PledgedAmount) * 100) || 0, 100)
  const isFulfilled = Status.toUpperCase() === 'FULFILLED' || AmountPaid >= PledgedAmount

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-warm-white rounded-lg shadow-lg p-6 md:p-8 space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-medium text-brown">Hi, {GuestName}</h2>
          <p className="text-muted-foreground text-sm">Here is the status of your pledge</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${isFulfilled ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {isFulfilled ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          <span>Status: {isFulfilled ? 'FULFILLED' : 'PARTIAL'}</span>
        </div>
      </div>

      <div className="space-y-2 pt-4">
        <div className="flex justify-between text-sm font-medium text-brown">
          <span>KES {AmountPaid.toLocaleString()} paid</span>
          <span>KES {PledgedAmount.toLocaleString()} total</span>
        </div>
        
        {/* Progress bar background */}
        <div className="h-4 bg-cream/80 border border-border rounded-full overflow-hidden">
          {/* Progress fill */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${isFulfilled ? 'bg-sage' : 'bg-terracotta'}`}
          />
        </div>
        <p className="text-right text-xs text-muted-foreground">{percentage}% completed</p>
      </div>

      {!isFulfilled && (
        <div className="pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onMakePayment}
            className="w-full py-4 bg-terracotta text-warm-white font-medium rounded-md hover:bg-terracotta/90 transition-colors shadow-lg shadow-terracotta/20 flex items-center justify-center gap-2"
          >
            <span>Make an Installment Payment</span>
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      )}

      {isFulfilled && (
        <div className="pt-4 text-center text-sage font-medium">
          Thank you for completely fulfilling your pledge! 
        </div>
      )}
    </motion.div>
  )
}
