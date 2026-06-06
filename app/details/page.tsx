'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { MapPin, Clock, Calendar, HelpCircle, Church, PartyPopper } from 'lucide-react'
import { HandSignIcon } from '@/components/hand-sign-icon'
import { SimpleLeaf } from '@/components/leaf-decoration'
import { CornerWreath } from '@/components/florals/corner-wreath'
import Link from 'next/link'
import Image from 'next/image'

export default function DetailsPage() {
  const prefersReducedMotion = useReducedMotion()

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: prefersReducedMotion ? 0 : 0.6, ease: 'easeOut' }
  }

  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.15
      }
    },
    viewport: { once: true }
  }

  const staggerItem = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: prefersReducedMotion ? 0 : 0.5 }
  }
  const faqs = [
    {
      question: 'Where should I park?',
      answer: 'Free parking is available at both venues. The church has a large lot behind the building, and the reception barn has ample space in the front field. Signs will guide you.'
    },
    {
      question: 'Are children welcome?',
      answer: 'Absolutely! We love little ones. A supervised kids corner with activities will be available at the reception for ages 3-10.'
    },
    {
      question: 'What about gifts?',
      answer: 'Your presence is truly the greatest gift. We have a small registry for those who wish to give.'
    },
    {
      question: 'Will there be sign language interpretation?',
      answer: 'Yes! The ceremony and key reception moments will have ASL interpretation. Seating near the interpreter will be available — just let us know on your RSVP.'
    },
    {
      question: 'Can I take photos during the ceremony?',
      answer: 'We kindly ask for an unplugged ceremony — please silence devices and enjoy being present. You are welcome to take photos during the reception!'
    },
    {
      question: 'Is the venue accessible?',
      answer: 'Yes, both venues are wheelchair accessible. Please reach out if you have specific accessibility needs and we will accommodate you.'
    }
  ]

  return (
    <div className="min-h-screen bg-cream pt-24 pb-16">
      {/* Header */}
      <motion.section 
        className="max-w-4xl mx-auto px-6 text-center mb-20"
        {...fadeInUp}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <SimpleLeaf className="w-6 h-6 text-sage/60 rotate-[-30deg]" />
          <HandSignIcon className="w-8 h-8 text-terracotta/70" />
          <SimpleLeaf className="w-6 h-6 text-sage/60 rotate-[30deg] scale-x-[-1]" />
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-brown mb-4">
          Wedding Details
        </h1>
        <p className="text-brown/70 max-w-lg mx-auto leading-relaxed">
          Everything you need to know about our celebration of love and faith
        </p>
      </motion.section>

      <div className="max-w-4xl mx-auto px-6 space-y-20">
        {/* Ceremony Section */}
        <motion.section
          {...fadeInUp}
          className="bg-warm-white rounded-2xl shadow-lg p-8 md:p-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-terracotta/10 rounded-full flex items-center justify-center">
              <Church className="w-6 h-6 text-terracotta" />
            </div>
            <h2 className="font-serif text-3xl text-brown">The Ceremony</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Calendar className="w-5 h-5 text-sage mt-1 shrink-0" />
                <div>
                  <p className="font-medium text-brown">Saturday, September 5, 2026</p>
                  <p className="text-sm text-brown/60">Save the date!</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-sage mt-1 shrink-0" />
                <div>
                  <p className="font-medium text-brown">10:00 AM</p>
                  <p className="text-sm text-brown/60">Please arrive by 9:45 AM</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-sage mt-1 shrink-0" />
              <div>
                <p className="font-medium text-brown">CITAM Nakuru</p>
                <p className="text-brown/70">Nakuru, Kenya</p>
                <a 
                  href="https://maps.app.goo.gl/6MkVvPTAKdL21Aj28" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm text-terracotta hover:underline"
                >
                  View on Map
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 relative p-3 md:p-4 bg-white shadow-xl rounded-sm border border-neutral-100 rotate-[1deg] max-w-xl mx-auto">
            {/* Flower Petal Frame */}
            <CornerWreath corner="top-left" size={100} className="absolute top-[-20px] left-[-20px] text-sage opacity-90 z-10 pointer-events-none drop-shadow-md" />
            <CornerWreath corner="bottom-right" size={100} className="absolute bottom-[-20px] right-[-20px] text-terracotta opacity-80 z-10 pointer-events-none drop-shadow-md" />
            
            <div className="relative w-full h-64 sm:h-80 overflow-hidden bg-neutral-200">
              <Image 
                src="/images/church.jpg" 
                alt="CITAM Nakuru Church"
                fill
                className="object-cover"
              />
            </div>
            <div className="pt-4 pb-2 text-center">
              <p className="font-handwriting text-3xl text-brown">Where we say &ldquo;I do&rdquo;</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-brown/10">
            <div className="flex items-center gap-2 text-sm text-sage">
              <HandSignIcon className="w-4 h-4" />
              <span>ASL interpretation will be provided throughout the ceremony</span>
            </div>
          </div>
        </motion.section>

        {/* Reception Section */}
        <motion.section
          {...fadeInUp}
          className="bg-warm-white rounded-2xl shadow-lg p-8 md:p-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center">
              <PartyPopper className="w-6 h-6 text-sage" />
            </div>
            <h2 className="font-serif text-3xl text-brown">The Reception</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-terracotta mt-1 shrink-0" />
                <div>
                  <p className="font-medium text-brown">1:00 PM</p>
                  <p className="text-sm text-brown/60">Live performances, dinner, dancing & fellowship</p>
                </div>
              </div>
              <p className="text-brown/70 text-sm pl-9">
                Join us for an evening of celebration! The exact location within the venue will be announced on the wedding day.
              </p>
            </div>
            
            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-terracotta mt-1 shrink-0" />
              <div>
                <p className="font-medium text-brown">CITAM Nakuru</p>
                <p className="text-brown/70">Nakuru, Kenya</p>
                <a 
                  href="https://maps.app.goo.gl/6MkVvPTAKdL21Aj28" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm text-terracotta hover:underline"
                >
                  View on Map
                </a>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Dress Code Section */}
        <motion.section
          {...fadeInUp}
          className="bg-warm-white rounded-2xl shadow-lg p-8 md:p-10"
        >
          <h2 className="font-serif text-3xl text-brown mb-6 text-center">Dress Code</h2>
          
          <div className="text-center max-w-xl mx-auto">
            <p className="text-xl text-brown font-medium mb-3">Rustic Smart Casual</p>
            <p className="text-brown/70 leading-relaxed mb-6">
              Think elegant yet comfortable — our celebration includes both an indoor ceremony 
              and an outdoor barn reception. Ladies, you may want to consider wedge heels 
              for grass and gravel areas.
            </p>
            
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 bg-cream rounded-full">
                <div className="w-4 h-4 rounded-full bg-[#FAF6EF] border border-brown/20" />
                <span className="text-sm text-brown">Cream</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-cream rounded-full">
                <div className="w-4 h-4 rounded-full bg-[#C1714F]" />
                <span className="text-sm text-brown">Terracotta</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-cream rounded-full">
                <div className="w-4 h-4 rounded-full bg-[#7D9B76]" />
                <span className="text-sm text-brown">Sage</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-cream rounded-full">
                <div className="w-4 h-4 rounded-full bg-[#5C3D2E]" />
                <span className="text-sm text-brown">Brown</span>
              </div>
            </div>
            
            <p className="text-sm text-sage mt-4 flex items-center justify-center gap-2">
              <SimpleLeaf className="w-4 h-4" />
              Earthy tones are encouraged but not required
            </p>
          </div>
        </motion.section>

        {/* Our Verse Section */}
        <motion.section
          {...fadeInUp}
          className="relative overflow-hidden rounded-2xl bg-brown text-warm-white p-10 md:p-14"
        >
          {/* Decorative elements */}
          <SimpleLeaf className="absolute top-6 left-6 w-10 h-10 text-warm-white/10 rotate-[-20deg]" />
          <SimpleLeaf className="absolute bottom-6 right-6 w-10 h-10 text-warm-white/10 rotate-[160deg]" />
          <HandSignIcon className="absolute top-6 right-6 w-8 h-8 text-warm-white/10" />
          <HandSignIcon className="absolute bottom-6 left-6 w-8 h-8 text-warm-white/10" />
          
          <div className="relative text-center max-w-2xl mx-auto">
            <p className="text-warm-white/60 text-sm uppercase tracking-widest mb-6">Our Verse</p>
            <blockquote className="font-serif text-2xl md:text-3xl leading-relaxed mb-6">
              &ldquo;Two are better than one, because they have a good return for their labor: 
              If either of them falls down, one can help the other up.&rdquo;
            </blockquote>
            <cite className="text-warm-white/80 text-lg not-italic">
              — Ecclesiastes 4:9-10
            </cite>
            <p className="mt-6 text-warm-white/60 text-sm max-w-md mx-auto">
              This verse has guided our relationship from the very beginning — 
              a reminder that God designed us to walk through life together.
            </p>
          </div>
        </motion.section>

        {/* FAQ Section */}
        <motion.section
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: '-50px' }}
        >
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <HelpCircle className="w-6 h-6 text-terracotta" />
              <h2 className="font-serif text-3xl text-brown">Frequently Asked Questions</h2>
            </div>
            <p className="text-brown/60">Got questions? We&apos;ve got answers.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                viewport={{ once: true }}
                className="bg-warm-white rounded-xl p-6 shadow-sm"
              >
                <h3 className="font-medium text-brown mb-2">{faq.question}</h3>
                <p className="text-brown/70 text-sm leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          {...fadeInUp}
          className="text-center pt-8"
        >
          <p className="text-brown/70 mb-4">We can&apos;t wait to celebrate with you!</p>
          <Link
            href="/rsvp"
            className="inline-block px-8 py-3 bg-terracotta text-warm-white font-medium rounded-lg hover:bg-terracotta/90 transition-colors shadow-lg shadow-terracotta/20"
          >
            RSVP Now
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
