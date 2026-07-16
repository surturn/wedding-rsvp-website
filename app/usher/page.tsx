'use client'

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  Search,
  ClipboardList,
  Lock,
  X,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Users,
  Delete,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Guest {
  Id: number
  name: string
  phone: string
  Email: string
  attending: boolean
  guestCount: number
  message: string
  Token: string
  CheckedIn: boolean
  CheckedInAt: string | null
  QRCode: string | null
  CreatedAt: string
}

type Tab = 'scan' | 'search' | 'list'
type ScannerStatus = 'idle' | 'scanning' | 'found' | 'error'

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function UsherPage() {
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [pinSubmitting, setPinSubmitting] = useState(false)

  // Portal
  const [activeTab, setActiveTab] = useState<Tab>('scan')
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)

  // Scanner
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>('idle')
  const [scannerError, setScannerError] = useState('')
  const scannerRef = useRef<InstanceType<typeof import('html5-qrcode').Html5Qrcode> | null>(null)
  const scannerRunningRef = useRef(false)
  const processingRef = useRef(false)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Guest[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  // List
  const [guestList, setGuestList] = useState<Guest[]>([])
  const [listLoading, setListLoading] = useState(false)

  // Check-in
  const [checkingIn, setCheckingIn] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // Add-guest (door fallback)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addError, setAddError] = useState('')

  // ------------------------------------------------------------------
  // Auth check on mount
  // ------------------------------------------------------------------

  useEffect(() => {
    async function checkAuth() {
      try {
        // We don't have a /me for usher, so just set to false
        // The usher must enter PIN each session
      } catch {
        // not authenticated
      } finally {
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [])

  // ------------------------------------------------------------------
  // PIN submission (auto-submit when 4 digits entered)
  // ------------------------------------------------------------------

  const submitPin = useCallback(async (fullPin: string) => {
    setPinSubmitting(true)
    setPinError(false)

    try {
      const res = await fetch('/api/usher/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: fullPin }),
      })

      if (res.ok) {
        setIsAuthenticated(true)
      } else {
        setPinError(true)
        setPin('')
      }
    } catch {
      setPinError(true)
      setPin('')
    } finally {
      setPinSubmitting(false)
    }
  }, [])

  const handlePinDigit = useCallback(
    (digit: string) => {
      if (pinSubmitting) return
      setPinError(false)

      setPin(prev => {
        const next = prev + digit
        if (next.length === 4) {
          // Auto-submit
          submitPin(next)
        }
        return next.length <= 4 ? next : prev
      })
    },
    [pinSubmitting, submitPin]
  )

  const handlePinBackspace = useCallback(() => {
    if (pinSubmitting) return
    setPin(prev => prev.slice(0, -1))
    setPinError(false)
  }, [pinSubmitting])

  // ------------------------------------------------------------------
  // Logout
  // ------------------------------------------------------------------

  const handleLogout = useCallback(async () => {
    try {
      await stopScanner()
      await fetch('/api/usher/auth', { method: 'DELETE' })
    } catch {
      // ignore
    }
    setIsAuthenticated(false)
    setPin('')
    setActiveTab('scan')
    setSelectedGuest(null)
  }, [])

  // ------------------------------------------------------------------
  // Scanner
  // ------------------------------------------------------------------

  const startScanner = useCallback(async () => {
    if (scannerRunningRef.current || processingRef.current) return

    try {
      const { Html5Qrcode } = await import('html5-qrcode')

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader')
      }

      setScannerStatus('scanning')
      scannerRunningRef.current = true

      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          if (processingRef.current) return
          processingRef.current = true

          // Extract token from URL or use raw text if it's just a token
          let token = '';
          const confirmIdx = decodedText.indexOf('/confirm/');
          
          if (confirmIdx !== -1) {
            // It's a URL like https://domain.com/confirm/XYZ
            token = decodedText.substring(confirmIdx + '/confirm/'.length).split(/[?#]/)[0];
          } else {
            // Assume the QR code contains just the raw token string
            token = decodedText.trim();
          }

          if (!token || token.includes(' ')) {
            setScannerStatus('error');
            setScannerError('Invalid QR code format');
            processingRef.current = false;
            setTimeout(() => {
              setScannerStatus('scanning');
              setScannerError('');
            }, 2000);
            return;
          }

          setScannerStatus('found')

          // Stop scanner while showing guest card
          try {
            if (scannerRef.current && scannerRunningRef.current) {
              await scannerRef.current.stop()
              scannerRunningRef.current = false
            }
          } catch {
            // may already be stopped
          }

          // Fetch guest
          try {
            const res = await fetch(`/api/usher/guest?token=${encodeURIComponent(token)}`)
            if (!res.ok) {
              throw new Error('Guest not found')
            }
            const data = await res.json()
            setSelectedGuest(data.guest)
          } catch {
            setScannerStatus('error')
            setScannerError('Guest not found for this QR code')
            setTimeout(() => {
              setScannerStatus('idle')
              setScannerError('')
              processingRef.current = false
              startScanner()
            }, 2000)
            return
          }

          processingRef.current = false
        },
        () => {
          // QR decode failure — ignore (this fires constantly while scanning)
        }
      )
    } catch (err) {
      setScannerStatus('error')
      setScannerError(
        err instanceof Error
          ? err.message.includes('NotAllowedError')
            ? 'Camera permission denied. Please allow camera access.'
            : err.message
          : 'Failed to start camera'
      )
    }
  }, [])

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current && scannerRunningRef.current) {
        await scannerRef.current.stop()
        scannerRunningRef.current = false
      }
    } catch {
      // scanner may not be running
    }
    setScannerStatus('idle')
  }, [])

  // Start/stop scanner based on active tab
  useEffect(() => {
    if (!isAuthenticated) return

    if (activeTab === 'scan' && !selectedGuest) {
      const timer = setTimeout(() => {
        startScanner()
      }, 300)
      return () => {
        clearTimeout(timer)
        stopScanner()
      }
    } else {
      stopScanner()
    }
  }, [activeTab, isAuthenticated, selectedGuest, startScanner, stopScanner])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner()
      if (scannerRef.current) {
        try {
          scannerRef.current.clear()
        } catch {
          // ignore
        }
        scannerRef.current = null
      }
    }
  }, [stopScanner])

  // Resume scanner when guest card is dismissed
  const handleDismissGuest = useCallback(() => {
    setSelectedGuest(null)
    setShowConfetti(false)
    if (activeTab === 'scan') {
      processingRef.current = false
      setTimeout(() => startScanner(), 300)
    }
  }, [activeTab, startScanner])

  // ------------------------------------------------------------------
  // Search (debounced)
  // ------------------------------------------------------------------

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'search') return
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/usher/guests?search=${encodeURIComponent(searchQuery)}`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.guests || [])
        }
      } catch {
        // ignore
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, isAuthenticated, activeTab])

  // ------------------------------------------------------------------
  // Guest List
  // ------------------------------------------------------------------

  const fetchGuestList = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await fetch('/api/usher/guests')
      if (res.ok) {
        const data = await res.json()
        const guests = data.guests || []
        setGuestList(guests)
        // Cache for offline
        try {
          localStorage.setItem('usher_guest_cache', JSON.stringify(guests))
        } catch {
          // ignore
        }
      }
    } catch {
      // Try loading from cache
      try {
        const cached = localStorage.getItem('usher_guest_cache')
        if (cached) {
          setGuestList(JSON.parse(cached))
        }
      } catch {
        // ignore
      }
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && activeTab === 'list') {
      fetchGuestList()
    }
  }, [isAuthenticated, activeTab, fetchGuestList])

  const listStats = useMemo(() => {
    const total = guestList.length
    const checkedIn = guestList.filter(g => g.CheckedIn).length
    return { total, checkedIn, remaining: total - checkedIn }
  }, [guestList])

  // ------------------------------------------------------------------
  // Check-in action
  // ------------------------------------------------------------------

  const handleCheckIn = useCallback(async (guest: Guest) => {
    setCheckingIn(true)
    try {
      const res = await fetch(`/api/admin/guests/${guest.Id}/checkin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkedIn: true }),
      })

      if (!res.ok) throw new Error('Check-in failed')

      const data = await res.json()
      const updated = data.guest as Guest

      // Update the selected guest in the overlay
      setSelectedGuest(prev =>
        prev && prev.Id === guest.Id ? { ...prev, ...updated } : prev
      )

      // Update the guest list if loaded
      setGuestList(prev =>
        prev.map(g => (g.Id === guest.Id ? { ...g, ...updated } : g))
      )

      // Update search results if any
      setSearchResults(prev =>
        prev.map(g => (g.Id === guest.Id ? { ...g, ...updated } : g))
      )

      // Show confetti
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1500)
    } catch {
      // Show error briefly
    } finally {
      setCheckingIn(false)
    }
  }, [])

  // ------------------------------------------------------------------
  // Add guest (door fallback) — create + check in a walk-in / missing guest
  // ------------------------------------------------------------------

  const handleAddGuest = useCallback(async () => {
    const name = newName.trim()
    if (!name) {
      setAddError('Please enter a name.')
      return
    }
    setAddSubmitting(true)
    setAddError('')
    try {
      const guestCount = 1 + (parseInt(newCompany, 10) || 0)
      const res = await fetch('/api/usher/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, guestCount }),
      })
      if (!res.ok) throw new Error('Failed to add guest')

      const data = await res.json()
      const guest = data.guest as Guest

      // Show the guest card (already checked in) as confirmation.
      setSelectedGuest(guest)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1500)

      // Reset the form + search, and add to any loaded list.
      setShowAddForm(false)
      setNewName('')
      setNewCompany('')
      setSearchQuery('')
      setSearchResults([])
      setGuestList(prev => (prev.length > 0 ? [guest, ...prev] : prev))
    } catch {
      setAddError('Could not add guest. Please try again.')
    } finally {
      setAddSubmitting(false)
    }
  }, [newName, newCompany])

  // ------------------------------------------------------------------
  // Helper — format time
  // ------------------------------------------------------------------

  function formatTime(dateStr: string | null): string {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  // ------------------------------------------------------------------
  // Render — loading
  // ------------------------------------------------------------------

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0D1B4B] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
      </div>
    )
  }

  // ------------------------------------------------------------------
  // Render — PIN screen
  // ------------------------------------------------------------------

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0D1B4B] flex flex-col items-center justify-center px-6">
        {/* Branding */}
        <div className="text-center mb-10">
          <p className="text-[#C9A84C] text-sm tracking-[0.3em] uppercase font-medium mb-2">
            Invonics Technologies
          </p>
          <h1 className="text-white text-2xl font-semibold">Usher Portal</h1>
          <p className="text-gray-400 text-sm mt-2">Enter your 4-digit PIN</p>
        </div>

        {/* PIN dots */}
        <motion.div
          className="flex gap-4 mb-10"
          animate={pinError ? { x: [0, -12, 12, -12, 12, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                i < pin.length
                  ? 'bg-[#C9A84C] border-[#C9A84C]'
                  : pinError
                  ? 'border-red-400'
                  : 'border-gray-500'
              }`}
            />
          ))}
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {pinError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-red-400 text-sm mb-4"
            >
              Incorrect PIN. Try again.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map(
            key => {
              if (key === '') {
                return <div key="empty" />
              }
              if (key === 'back') {
                return (
                  <button
                    key="back"
                    onClick={handlePinBackspace}
                    disabled={pinSubmitting}
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-gray-400 hover:bg-white/10 active:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    <Delete className="w-6 h-6" />
                  </button>
                )
              }
              return (
                <button
                  key={key}
                  onClick={() => handlePinDigit(key)}
                  disabled={pinSubmitting || pin.length >= 4}
                  className="w-[72px] h-[72px] rounded-full bg-white/10 text-white text-2xl font-medium hover:bg-white/20 active:bg-white/30 transition-colors disabled:opacity-50"
                >
                  {key}
                </button>
              )
            }
          )}
        </div>

        {pinSubmitting && (
          <Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin mt-6" />
        )}
      </div>
    )
  }

  // ------------------------------------------------------------------
  // Render — authenticated portal
  // ------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0D1B4B] text-white px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[#C9A84C] text-[10px] tracking-[0.2em] uppercase">
            Invonics Technologies
          </p>
          <h1 className="text-base font-semibold">Usher Portal</h1>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          title="Lock"
        >
          <Lock className="w-5 h-5 text-gray-300" />
        </button>
      </header>

      {/* Tab Content */}
      <main className="flex-1 pt-[72px] pb-[72px] overflow-y-auto">
        {/* Scanner Tab */}
        {activeTab === 'scan' && (
          <div className="px-4 py-4">
            <h2 className="text-center text-lg font-semibold text-gray-800 mb-4">
              Scan Guest QR
            </h2>

            {/* Camera viewport */}
            <div className="max-w-sm mx-auto">
              <div
                className={`relative rounded-xl overflow-hidden border-2 transition-colors ${
                  scannerStatus === 'scanning'
                    ? 'border-[#C9A84C]'
                    : scannerStatus === 'found'
                    ? 'border-[#10B981]'
                    : scannerStatus === 'error'
                    ? 'border-[#EF4444]'
                    : 'border-[#E5E7EB]'
                }`}
              >
                <div
                  id="qr-reader"
                  className="w-full aspect-square bg-gray-900"
                />

                {/* Scanning overlay corners */}
                {scannerStatus === 'scanning' && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#C9A84C] rounded-tl-lg" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#C9A84C] rounded-tr-lg" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#C9A84C] rounded-bl-lg" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#C9A84C] rounded-br-lg" />
                  </div>
                )}

                {/* Found overlay */}
                {scannerStatus === 'found' && (
                  <div className="absolute inset-0 bg-[#10B981]/30 flex items-center justify-center">
                    <div className="bg-white rounded-full p-3">
                      <Check className="w-8 h-8 text-[#10B981]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Status strip */}
              <div className="mt-3 text-center">
                {scannerStatus === 'idle' && (
                  <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
                    Ready to scan
                  </div>
                )}
                {scannerStatus === 'scanning' && (
                  <div className="flex items-center justify-center gap-2 text-[#C9A84C] text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning...
                  </div>
                )}
                {scannerStatus === 'found' && (
                  <div className="flex items-center justify-center gap-2 text-[#10B981] text-sm font-medium">
                    <Check className="w-4 h-4" />
                    QR Detected
                  </div>
                )}
                {scannerStatus === 'error' && (
                  <div className="flex items-center justify-center gap-2 text-[#EF4444] text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {scannerError || 'Scan error'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="px-4 py-4">
            {/* Search input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 focus:border-[#C9A84C]"
              />
            </div>

            {/* Results */}
            {searchLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin" />
              </div>
            )}

            {!searchLoading && searchQuery && searchResults.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No guests found for &ldquo;{searchQuery}&rdquo;
              </p>
            )}

            {!searchQuery && !searchLoading && (
              <p className="text-center text-gray-400 py-8">
                Search for a guest by name, phone, or email
              </p>
            )}

            <div className="space-y-2">
              {searchResults.map(guest => (
                <GuestRow
                  key={guest.Id}
                  guest={guest}
                  onTap={() => setSelectedGuest(guest)}
                />
              ))}
            </div>

            {/* Add-guest fallback — for anyone not in the system */}
            <div className="mt-6 border-t border-[#E5E7EB] pt-4">
              {!showAddForm ? (
                <button
                  onClick={() => {
                    setNewName(searchQuery.trim())
                    setNewCompany('')
                    setAddError('')
                    setShowAddForm(true)
                  }}
                  className="w-full py-3 border-2 border-dashed border-[#C9A84C] text-[#0D1B4B] rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#C9A84C]/5 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Guest not listed? Add &amp; check in
                </button>
              ) : (
                <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                  <p className="text-sm font-semibold text-gray-700">
                    Add a guest not in the system
                  </p>

                  <input
                    type="text"
                    placeholder="Full name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 focus:border-[#C9A84C]"
                  />

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Additional guests in their party
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      placeholder="0"
                      value={newCompany}
                      onChange={e => setNewCompany(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 focus:border-[#C9A84C]"
                    />
                  </div>

                  {addError && (
                    <p className="text-sm text-[#EF4444]">{addError}</p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setShowAddForm(false)
                        setAddError('')
                      }}
                      disabled={addSubmitting}
                      className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddGuest}
                      disabled={addSubmitting}
                      className="flex-[2] py-2.5 bg-[#10B981] text-white rounded-lg font-medium hover:bg-[#0ea472] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {addSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Add &amp; Check In
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* List Tab */}
        {activeTab === 'list' && (
          <div className="px-4 py-4">
            {/* Summary bar */}
            <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Check-In Progress</h3>
                <button
                  onClick={fetchGuestList}
                  disabled={listLoading}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-500 ${listLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{listStats.total}</p>
                  <p className="text-xs text-gray-500">Confirmed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#10B981]">{listStats.checkedIn}</p>
                  <p className="text-xs text-gray-500">Checked In</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#F59E0B]">{listStats.remaining}</p>
                  <p className="text-xs text-gray-500">Remaining</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10B981] rounded-full transition-all duration-500"
                  style={{
                    width: `${listStats.total > 0 ? (listStats.checkedIn / listStats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Guest list */}
            {listLoading && guestList.length === 0 && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin" />
              </div>
            )}

            <div className="space-y-2">
              {guestList.map(guest => (
                <GuestRow
                  key={guest.Id}
                  guest={guest}
                  onTap={() => setSelectedGuest(guest)}
                  showGuestCount
                />
              ))}
            </div>

            {!listLoading && guestList.length === 0 && (
              <p className="text-center text-gray-400 py-8">No confirmed guests found</p>
            )}
          </div>
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] flex">
        <TabButton
          icon={<Camera className="w-5 h-5" />}
          label="Scan"
          active={activeTab === 'scan'}
          onTap={() => setActiveTab('scan')}
        />
        <TabButton
          icon={<Search className="w-5 h-5" />}
          label="Search"
          active={activeTab === 'search'}
          onTap={() => setActiveTab('search')}
        />
        <TabButton
          icon={<ClipboardList className="w-5 h-5" />}
          label="List"
          active={activeTab === 'list'}
          onTap={() => setActiveTab('list')}
        />
      </nav>

      {/* Guest Card Overlay */}
      <AnimatePresence>
        {selectedGuest && (
          <GuestCardOverlay
            guest={selectedGuest}
            onClose={handleDismissGuest}
            onCheckIn={handleCheckIn}
            checkingIn={checkingIn}
            showConfetti={showConfetti}
            formatTime={formatTime}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab Button
// ---------------------------------------------------------------------------

function TabButton({
  icon,
  label,
  active,
  onTap,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onTap: () => void
}) {
  return (
    <button
      onClick={onTap}
      className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
        active ? 'text-[#C9A84C]' : 'text-gray-400'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Guest Row (used in Search + List tabs)
// ---------------------------------------------------------------------------

function GuestRow({
  guest,
  onTap,
  showGuestCount,
}: {
  guest: Guest
  onTap: () => void
  showGuestCount?: boolean
}) {
  return (
    <button
      onClick={onTap}
      className="w-full bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm active:bg-gray-50 transition-colors text-left"
    >
      {/* Check indicator */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          guest.CheckedIn
            ? 'bg-[#10B981]/10'
            : guest.attending
            ? 'bg-gray-100'
            : 'bg-red-50'
        }`}
      >
        {guest.CheckedIn ? (
          <Check className="w-4 h-4 text-[#10B981]" />
        ) : guest.attending ? (
          <Users className="w-4 h-4 text-gray-400" />
        ) : (
          <X className="w-4 h-4 text-[#EF4444]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">{guest.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              guest.attending
                ? 'bg-[#10B981]/10 text-[#10B981]'
                : 'bg-[#EF4444]/10 text-[#EF4444]'
            }`}
          >
            {guest.attending ? 'Attending' : 'Declined'}
          </span>
          {guest.CheckedIn && (
            <span className="text-[10px] text-gray-400">
              ✔ Checked in
            </span>
          )}
        </div>
      </div>

      {/* Guest count badge */}
      {showGuestCount && guest.guestCount > 1 && (
        <span className="text-xs bg-[#0D1B4B]/10 text-[#0D1B4B] px-2 py-1 rounded-full font-medium">
          +{guest.guestCount - 1}
        </span>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Guest Card Overlay
// ---------------------------------------------------------------------------

function GuestCardOverlay({
  guest,
  onClose,
  onCheckIn,
  checkingIn,
  showConfetti,
  formatTime,
}: {
  guest: Guest
  onClose: () => void
  onCheckIn: (guest: Guest) => void
  checkingIn: boolean
  showConfetti: boolean
  formatTime: (dateStr: string | null) => string
}) {
  // Determine status
  const isCheckedIn = guest.CheckedIn
  const isAttending = guest.attending

  let statusBg: string
  let statusText: string

  if (isCheckedIn) {
    const time = formatTime(guest.CheckedInAt)
    statusBg = 'bg-[#F59E0B]'
    statusText = `Already checked in${time ? ` at ${time}` : ''}`
  } else if (isAttending) {
    statusBg = 'bg-[#10B981]'
    statusText = 'Confirmed guest'
  } else {
    statusBg = 'bg-[#EF4444]'
    statusText = 'Declined RSVP'
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />

      {/* Card */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Status banner */}
        <div className={`${statusBg} text-white px-4 py-2.5 mx-4 rounded-lg text-sm font-medium text-center`}>
          {statusText}
        </div>

        {/* Guest info */}
        <div className="px-4 py-5 space-y-4">
          <h3 className="text-2xl font-serif text-gray-900">{guest.name}</h3>

          <div className="space-y-2 text-sm">
            {guest.Email && (
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-gray-400 w-16 text-xs">Email</span>
                <span className="break-all">{guest.Email}</span>
              </div>
            )}
            {guest.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-gray-400 w-16 text-xs">Phone</span>
                <span>{guest.phone}</span>
              </div>
            )}
            {guest.guestCount > 1 && (
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-gray-400 w-16 text-xs">Guests</span>
                <span className="bg-[#0D1B4B]/10 text-[#0D1B4B] px-2 py-0.5 rounded-full text-xs font-medium">
                  + {guest.guestCount - 1} guest{guest.guestCount > 2 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Message */}
          {guest.message && (
            <div className="bg-gray-50 rounded-lg p-3 border-l-2 border-[#C9A84C]">
              <p className="text-xs text-gray-400 mb-1">Message</p>
              <p className="text-sm text-gray-600 italic">&ldquo;{guest.message}&rdquo;</p>
            </div>
          )}

          {/* Action button */}
          {isAttending && !isCheckedIn && (
            <div className="relative">
              <button
                onClick={() => onCheckIn(guest)}
                disabled={checkingIn}
                className="w-full py-3.5 bg-[#10B981] text-white rounded-xl font-medium text-base hover:bg-[#0ea472] active:bg-[#0d9668] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {checkingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking in...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Check In
                  </>
                )}
              </button>

              {/* Confetti */}
              {showConfetti && <ConfettiBurst />}
            </div>
          )}

          {isCheckedIn && (
            <button
              disabled
              className="w-full py-3.5 bg-gray-200 text-gray-500 rounded-xl font-medium text-base cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Already Checked In
            </button>
          )}
        </div>

        {/* Extra bottom padding for safe area */}
        <div className="h-6" />
      </motion.div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Confetti Burst (simple CSS animation)
// ---------------------------------------------------------------------------

function ConfettiBurst() {
  const dots = [
    { color: '#C9A84C', delay: '0s', x: '-20px', y: '-40px' },
    { color: '#10B981', delay: '0.1s', x: '20px', y: '-35px' },
    { color: '#0D1B4B', delay: '0.05s', x: '0px', y: '-45px' },
    { color: '#F59E0B', delay: '0.15s', x: '-15px', y: '-30px' },
    { color: '#EF4444', delay: '0.08s', x: '15px', y: '-42px' },
  ]

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1.5, 0],
            x: dot.x,
            y: dot.y,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.8, delay: parseFloat(dot.delay) }}
          className="absolute w-3 h-3 rounded-full"
          style={{ backgroundColor: dot.color }}
        />
      ))}
    </div>
  )
}
