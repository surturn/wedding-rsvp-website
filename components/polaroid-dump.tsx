'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { RotateCcw } from 'lucide-react';
import { CornerWreath } from '@/components/florals/corner-wreath';

// The Data Structure mapping your actual files
const storyChapters = [
  {
    id: 'outings',
    title: 'Chapter 1: "Just Bible Study Mates"',
    photos: [
      { 
        id: 'p1', 
        src: '/images/photoDump/photoDumpManuh.jpeg', 
        alt: 'Manuh', 
        caption: 'Just a Bible study mate...',
        detailedStory: "According to Manuh, he was very sincere that Anne James (AJ) was just a Bible study mate. Absolutely no strings attached! 😅",
        initRotation: -4, xOffset: -30 
      },
      { 
        id: 'p2', 
        src: '/images/photoDump/photoDumpAnne.jpeg', 
        alt: 'Anne James', 
        caption: 'No strings attached?',
        detailedStory: "...But of course, he had already started developing ideas in his mind.",
        initRotation: 2, xOffset: 10 
      },
      { 
        id: 'p3', 
        src: '/images/natureWalk/natureWalk.jpeg', 
        alt: 'Nature walk', 
        caption: 'Exploring',
        detailedStory: "Building our friendship, one walk at a time.",
        initRotation: 6, xOffset: 40 
      },
    ],
  },
  {
    id: 'prayer',
    title: 'Chapter 2: The Cross-Over Prayer',
    photos: [
      { 
        id: 'p4', 
        src: '/images/photoDump/passportManu.jpeg', 
        alt: 'Manuh Passport', 
        caption: 'Dec 31, 2024 • Ihura Stadium',
        detailedStory: "While crossing over into 2025 at Ihura stadium in Muranga, we made a prayer while holding Manuh's passport.",
        initRotation: -6, xOffset: -20 
      },
      { 
        id: 'p5', 
        src: '/images/proposal/proposalPrayer.jpeg', 
        alt: 'Praying together', 
        caption: 'Faith & Foundation',
        detailedStory: "We prayed that God would bless AJ with a passport of her own in the coming year.",
        initRotation: 4, xOffset: 20 
      },
      { 
        id: 'p6', 
        src: '/images/photoDump/passportAnne.jpeg', 
        alt: 'AJ New Passport', 
        caption: 'Answered Prayers',
        detailedStory: "In just a few months' time, AJ had her own passport exactly as we had prayed at the beginning of the year.",
        initRotation: -2, xOffset: 50 
      },
    ],
  },
  {
    id: 'proposal',
    title: 'Chapter 3: The Big Question',
    photos: [
      { 
        id: 'p7', 
        src: '/images/proposal/kneeProposal.jpeg', 
        alt: 'Proposal at Glee Hotel', 
        caption: 'Oct 25th • Glee Hotel',
        detailedStory: "October 25th was the proposal day at Glee Hotel. Joined in by some amazing friends to witness the moment.",
        initRotation: -5, xOffset: -40 
      },
      { 
        id: 'p8', 
        src: '/images/proposal/theRing.jpeg', 
        alt: 'Engagement Ring', 
        caption: 'The Ring',
        detailedStory: "A promise for the future.",
        initRotation: 8, xOffset: 50 
      },
      { 
        id: 'p9', 
        src: '/images/proposal/proposalCouplephoto.jpeg', 
        alt: 'Couple post-proposal', 
        caption: 'She said Yes!',
        detailedStory: "The start of our forever.",
        initRotation: 3, xOffset: 0 
      },
    ],
  },
];

export default function PolaroidDump() {
  // Global z-index tracker to bring interacted photos to the front
  const [topZIndex, setTopZIndex] = useState(10);
  const containerRef = useRef<HTMLDivElement>(null);

  const bringToFront = () => {
    setTopZIndex((prev) => prev + 1);
    return topZIndex + 1;
  };

  return (
    <div className="py-12 md:py-24 px-4 sm:px-8 bg-[#fdfbf7]">
      <article 
        aria-label="Our Story Interactive Scrapbook" 
        className="w-full py-20 overflow-hidden bg-cream relative max-w-7xl mx-auto
                   border-[16px] md:border-[24px] border-[#3b1c11] 
                   shadow-[inset_0_0_60px_rgba(0,0,0,0.5),0_25px_50px_-12px_rgba(0,0,0,0.5)]"
        style={{
          borderImage: 'linear-gradient(45deg, #2a1005, #4d1f1c, #2a1005) 1',
        }}
        ref={containerRef}
      >
        {/* Entangling Vines on the Frame */}
        <CornerWreath corner="top-left" size={200} className="text-[#4e6b47] opacity-90 drop-shadow-lg z-0 pointer-events-none" />
        <CornerWreath corner="top-right" size={200} className="text-[#4e6b47] opacity-90 drop-shadow-lg z-0 pointer-events-none" />
        <CornerWreath corner="bottom-left" size={200} className="text-[#4e6b47] opacity-90 drop-shadow-lg z-0 pointer-events-none" />
        <CornerWreath corner="bottom-right" size={200} className="text-[#4e6b47] opacity-90 drop-shadow-lg z-0 pointer-events-none" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 flex flex-col gap-32">
        
        {/* Main Section Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-terracotta/40" />
            <svg className="w-8 h-8 text-terracotta/60" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <div className="h-px w-12 bg-terracotta/40" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-brown">Our Story</h2>
        </div>

        {storyChapters.map((chapter) => (
          <section key={chapter.id} className="relative w-full min-h-[60vh] flex flex-col md:flex-row items-center justify-center border-b border-brown/10 pb-20 last:border-0">
            
            {/* Chapter Heading */}
            <div className="md:absolute left-0 top-0 mb-10 md:mb-0 z-0">
              <h3 className="text-3xl md:text-5xl font-serif text-brown/40 tracking-tighter">
                {chapter.title}
              </h3>
            </div>

            {/* The Scattered Photo Stack */}
            <div className="relative w-full max-w-2xl h-[400px] md:h-[500px] flex items-center justify-center">
              {chapter.photos.map((photo, index) => (
                <PolaroidCard
                  key={photo.id}
                  photo={photo}
                  index={index}
                  containerRef={containerRef}
                  bringToFront={bringToFront}
                />
              ))}
            </div>
            
          </section>
        ))}
      </div>
    </article>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Polaroid Card Component (Handles 3D Flip & Drag Physics)
// ---------------------------------------------------------------------------

function PolaroidCard({ 
  photo, 
  index, 
  containerRef, 
  bringToFront 
}: { 
  photo: any; 
  index: number; 
  containerRef: React.RefObject<HTMLDivElement>;
  bringToFront: () => number;
}) {
  const [localZ, setLocalZ] = useState(index);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Track dragging so we don't accidentally flip while dragging
  const isDragging = useRef(false);

  const handlePointerDown = () => {
    setLocalZ(bringToFront());
  };

  return (
    <motion.div
      drag
      dragConstraints={containerRef}
      dragElastic={0.2}
      onDragStart={() => {
        isDragging.current = true;
        setLocalZ(bringToFront());
      }}
      onDragEnd={() => {
        // Small timeout to prevent click from firing immediately after drag
        setTimeout(() => {
          isDragging.current = false;
        }, 150);
      }}
      onPointerDown={handlePointerDown}
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ 
        opacity: 1, 
        y: 0,
        transition: { type: 'spring', stiffness: 50, damping: 20 }
      }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ scale: 1.05 }}
      whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
      style={{ 
        zIndex: localZ, 
        touchAction: 'pan-y',
        perspective: 1200,
        x: photo.xOffset,
        rotate: photo.initRotation,
        willChange: 'transform'
      }}
      className="absolute cursor-grab"
    >
      {/* 3D Flip Container */}
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
        className="relative w-56 md:w-72 h-[340px] md:h-[400px]"
      >
        
        {/* ================= FRONT OF CARD ================= */}
        <div 
          className="absolute inset-0 p-3 md:p-4 bg-white shadow-xl rounded-sm flex flex-col gap-3 border border-neutral-100"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'translateZ(1px)' }}
        >
          <div className="relative w-full flex-1 overflow-hidden bg-neutral-200">
            <Image 
              src={photo.src} 
              alt={photo.alt}
              fill
              className="object-cover pointer-events-none"
              sizes="(max-width: 768px) 224px, 288px"
            />
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <p className="font-handwriting text-2xl md:text-3xl text-brown leading-none flex-1 truncate pr-2">
              {photo.caption}
            </p>
            
            {/* Flip Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (!isDragging.current) setIsFlipped(true);
              }}
              className="p-1.5 md:p-2 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors text-brown/60 hover:text-brown"
              aria-label="Read story"
              title="Flip to read"
            >
              <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* ================= BACK OF CARD ================= */}
        <div 
          className="absolute inset-0 p-6 bg-[#fdfbf7] shadow-xl rounded-sm flex flex-col items-center justify-center border border-neutral-100"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg) translateZ(1px)' }}
        >
          {/* Subtle tape effect on back */}
          <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-24 h-6 bg-white/40 backdrop-blur-sm border border-white/20 shadow-sm rotate-[-2deg] opacity-70" />
          
          <p className="font-serif text-lg md:text-xl text-brown/90 leading-relaxed text-center mb-6">
            {photo.detailedStory}
          </p>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (!isDragging.current) setIsFlipped(false);
            }}
            className="mt-auto px-4 py-2 border border-brown/20 rounded-full text-sm font-sans text-brown/60 hover:text-brown hover:bg-brown/5 transition-colors"
          >
            Flip back
          </button>
        </div>

      </motion.div>
    </motion.div>
  );
}
