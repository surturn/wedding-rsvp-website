'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  UserPlus,
  Search,
  ChevronUp,
  ChevronDown,
  Lock,
  AlertCircle,
  Loader2,
  Clock,
  LogOut
} from 'lucide-react'
import { HandSignIcon } from '@/components/hand-sign-icon'

// ---------------------------------------------------------------------------
// Types (client-side mirror of the NocoDB Guest shape)
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

type SortField =
  | 'name'
  | 'phone'
  | 'attending'
  | 'guestCount'
  | 'CreatedAt'
  | 'CheckedIn'
  | 'CheckedInAt'
type SortDirection = 'asc' | 'desc'

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const prefersReducedMotion = useReducedMotion()

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Data state
  const [guests, setGuests] = useState<Guest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Table state
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('CreatedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [checkingInId, setCheckingInId] = useState<number | null>(null)

  // ------------------------------------------------------------------
  // Auth: check session cookie via /api/admin/me
  // ------------------------------------------------------------------

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/me')
        if (res.ok) {
          setIsAuthenticated(true)
        }
      } catch {
        // not authenticated
      } finally {
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [])

  // Fetch guests when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchGuests()
    }
  }, [isAuthenticated])

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  // ------------------------------------------------------------------
  // Data fetching
  // ------------------------------------------------------------------

  const fetchGuests = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/guests')

      if (response.status === 401) {
        setIsAuthenticated(false)
        return
      }

      if (!response.ok) throw new Error('Failed to fetch guests')

      const data = await response.json()
      setGuests(data.guests || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load guests')
    } finally {
      setIsLoading(false)
    }
  }

  // ------------------------------------------------------------------
  // Auth actions
  // ------------------------------------------------------------------

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        setPasswordError('Incorrect password')
        return
      }

      setIsAuthenticated(true)
      setPasswordError('')
      setPassword('')
    } catch {
      setPasswordError('Authentication failed. Please try again.')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
    } catch {
      // ignore
    }
    setIsAuthenticated(false)
    setGuests([])
  }

  // ------------------------------------------------------------------
  // Check-in action
  // ------------------------------------------------------------------

  const handleCheckIn = useCallback(async (guestId: number) => {
    setCheckingInId(guestId)
    try {
      const res = await fetch(`/api/admin/guests/${guestId}/checkin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkedIn: true }),
      })

      if (!res.ok) throw new Error('Failed to check in guest')

      const data = await res.json()
      // Update guest in local state
      setGuests(prev =>
        prev.map(g => (g.Id === guestId ? { ...g, ...data.guest } : g))
      )
      setToast({ message: `${data.guest?.name || 'Guest'} checked in!`, type: 'success' })
    } catch {
      setToast({ message: 'Failed to check in guest', type: 'error' })
    } finally {
      setCheckingInId(null)
    }
  }, [])

  // ------------------------------------------------------------------
  // Stats
  // ------------------------------------------------------------------

  const stats = useMemo(() => {
    const attending = guests.filter(g => g.attending)
    const notAttending = guests.filter(g => !g.attending)
    const checkedIn = guests.filter(g => g.CheckedIn)
    const atDoor = guests.filter(g => g.attending && !g.CheckedIn)
    const totalGuests = attending.reduce((sum, g) => sum + (g.guestCount || 1), 0)

    return {
      total: guests.length,
      attending: attending.length,
      notAttending: notAttending.length,
      totalGuests,
      checkedIn: checkedIn.length,
      atDoor: atDoor.length,
    }
  }, [guests])

  // Chart calculations
  const chartData = useMemo(() => {
    const total = stats.attending + stats.notAttending
    if (total === 0) return { attendingPercent: 0, notAttendingPercent: 0 }
    return {
      attendingPercent: Math.round((stats.attending / total) * 100),
      notAttendingPercent: Math.round((stats.notAttending / total) * 100),
    }
  }, [stats])

  // ------------------------------------------------------------------
  // Filter & sort
  // ------------------------------------------------------------------

  const filteredAndSortedGuests = useMemo(() => {
    let filtered = guests.filter(
      g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.phone.includes(searchTerm) ||
        g.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.message.toLowerCase().includes(searchTerm.toLowerCase())
    )

    filtered.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]

      if (aVal == null && bVal == null) return 0
      if (aVal == null) return sortDirection === 'asc' ? -1 : 1
      if (bVal == null) return sortDirection === 'asc' ? 1 : -1

      const aStr = typeof aVal === 'string' ? aVal.toLowerCase() : aVal
      const bStr = typeof bVal === 'string' ? bVal.toLowerCase() : bVal

      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [guests, searchTerm, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    )
  }

  // ------------------------------------------------------------------
  // Helper — format check-in time
  // ------------------------------------------------------------------

  function formatCheckedInAt(dateStr: string | null): string {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    const hh = d.getHours().toString().padStart(2, '0')
    const mm = d.getMinutes().toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${hh}:${mm}, ${day} ${months[d.getMonth()]}`
  }

  // ------------------------------------------------------------------
  // Render — loading spinner
  // ------------------------------------------------------------------

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
      </div>
    )
  }

  // ------------------------------------------------------------------
  // Render — login screen
  // ------------------------------------------------------------------

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-warm-white rounded-xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-terracotta" />
              </div>
              <h1 className="font-serif text-2xl text-brown mb-2">Admin Access</h1>
              <p className="text-muted-foreground text-sm">
                Enter the password to view RSVPs
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    setPasswordError('')
                  }}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-cream/50 focus:outline-none focus:ring-2 focus:ring-terracotta/50 text-brown placeholder:text-muted-foreground"
                />
                <AnimatePresence>
                  {passwordError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-destructive text-sm mt-2 flex items-center gap-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {passwordError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-terracotta text-warm-white rounded-lg font-medium hover:bg-terracotta/90 transition-colors"
              >
                Access Dashboard
              </motion.button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-6 italic">
              &ldquo;Faithful in little, faithful in much&rdquo;
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // ------------------------------------------------------------------
  // Render — authenticated dashboard
  // ------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-cream py-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              className={`fixed top-4 left-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${
                toast.type === 'success' ? 'bg-sage' : 'bg-destructive'
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <HandSignIcon className="w-8 h-8 text-terracotta" />
            <div>
              <h1 className="font-serif text-3xl md:text-4xl text-brown">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">Manuh &amp; Anne&apos;s Wedding RSVPs</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="self-start sm:self-auto px-4 py-2 text-sm text-muted-foreground hover:text-brown border border-border rounded-lg hover:bg-cream transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </motion.div>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 mb-6 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
              <button onClick={fetchGuests} className="ml-auto text-sm underline hover:no-underline">
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid — 6 cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
        >
          <StatCard icon={<Users className="w-5 h-5" />} label="Total RSVPs" value={stats.total} color="brown" delay={0} />
          <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Attending" value={stats.attending} color="sage" delay={0.05} />
          <StatCard icon={<XCircle className="w-5 h-5" />} label="Not Attending" value={stats.notAttending} color="terracotta" delay={0.1} />
          <StatCard icon={<UserPlus className="w-5 h-5" />} label="Total Guests" value={stats.totalGuests} color="sage" delay={0.15} />
          <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Checked In" value={stats.checkedIn} color="sage" delay={0.2} />
          <StatCard icon={<Clock className="w-5 h-5" />} label="At Door" value={stats.atDoor} color="terracotta" delay={0.25} />
        </motion.div>

        {/* Chart Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-warm-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="font-serif text-xl text-brown mb-6">Attendance Overview</h2>

          {stats.total === 0 ? (
            <p className="text-muted-foreground text-center py-8">No RSVPs yet</p>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Pie Chart */}
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="20" />
                  <motion.circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="var(--sage)" strokeWidth="20"
                    strokeDasharray={`${chartData.attendingPercent * 2.51} 251`}
                    initial={{ strokeDasharray: '0 251' }}
                    animate={{ strokeDasharray: `${chartData.attendingPercent * 2.51} 251` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-serif text-brown">{chartData.attendingPercent}%</p>
                    <p className="text-xs text-muted-foreground">Attending</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-sage" />
                  <span className="text-brown">Attending</span>
                  <span className="text-muted-foreground">({stats.attending})</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-terracotta" />
                  <span className="text-brown">Not Attending</span>
                  <span className="text-muted-foreground">({stats.notAttending})</span>
                </div>
              </div>

              {/* Bars */}
              <div className="flex-1 w-full md:w-auto">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-brown">Attending</span>
                      <span className="text-muted-foreground">{chartData.attendingPercent}%</span>
                    </div>
                    <div className="h-3 bg-border rounded-full overflow-hidden">
                      <motion.div className="h-full bg-sage rounded-full" initial={{ width: 0 }} animate={{ width: `${chartData.attendingPercent}%` }} transition={{ duration: 1, delay: 0.5 }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-brown">Not Attending</span>
                      <span className="text-muted-foreground">{chartData.notAttendingPercent}%</span>
                    </div>
                    <div className="h-3 bg-border rounded-full overflow-hidden">
                      <motion.div className="h-full bg-terracotta rounded-full" initial={{ width: 0 }} animate={{ width: `${chartData.notAttendingPercent}%` }} transition={{ duration: 1, delay: 0.6 }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Guest Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-warm-white rounded-xl shadow-lg overflow-hidden"
        >
          {/* Table Header */}
          <div className="p-4 md:p-6 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-serif text-xl text-brown">All RSVPs</h2>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, phone, email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-cream/50 focus:outline-none focus:ring-2 focus:ring-terracotta/50 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream/50 text-sm text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-brown transition-colors" onClick={() => handleSort('name')}>
                      Name <SortIcon field="name" />
                    </th>
                    <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-brown transition-colors" onClick={() => handleSort('phone')}>
                      Phone <SortIcon field="phone" />
                    </th>
                    <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-brown transition-colors" onClick={() => handleSort('attending')}>
                      Attending <SortIcon field="attending" />
                    </th>
                    <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-brown transition-colors" onClick={() => handleSort('guestCount')}>
                      Guests <SortIcon field="guestCount" />
                    </th>
                    <th className="text-left px-4 py-3 font-medium">Message</th>
                    <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-brown transition-colors" onClick={() => handleSort('CheckedIn')}>
                      Checked In <SortIcon field="CheckedIn" />
                    </th>
                    <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-brown transition-colors" onClick={() => handleSort('CheckedInAt')}>
                      Checked In At <SortIcon field="CheckedInAt" />
                    </th>
                    <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-brown transition-colors" onClick={() => handleSort('CreatedAt')}>
                      Date <SortIcon field="CreatedAt" />
                    </th>
                    <th className="text-left px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAndSortedGuests.map(guest => (
                    <motion.tr
                      key={guest.Id}
                      className="hover:bg-cream/30 transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="px-4 py-4">
                        <p className="font-medium text-brown">{guest.name}</p>
                        {guest.Email && (
                          <p className="text-xs text-muted-foreground">{guest.Email}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{guest.phone || '—'}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          guest.attending ? 'bg-sage/20 text-sage' : 'bg-terracotta/20 text-terracotta'
                        }`}>
                          {guest.attending ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-brown">
                        {guest.attending ? guest.guestCount : '—'}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground max-w-xs break-words whitespace-normal">
                        {guest.message || '—'}
                      </td>
                      <td className="px-4 py-4">
                        {guest.CheckedIn ? (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-sage/20 text-sage">✔</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                        {formatCheckedInAt(guest.CheckedInAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {new Date(guest.CreatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        {guest.attending && !guest.CheckedIn ? (
                          <button
                            onClick={() => handleCheckIn(guest.Id)}
                            disabled={checkingInId === guest.Id}
                            className="bg-sage text-white rounded-md px-2 py-1 text-xs hover:bg-sage/90 transition-colors disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                          >
                            {checkingInId === guest.Id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : null}
                            Check in
                          </button>
                        ) : guest.CheckedIn ? (
                          <span className="bg-sage/20 text-sage rounded-md px-2 py-1 text-xs inline-block whitespace-nowrap">
                            Checked in ✔
                          </span>
                        ) : null}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {filteredAndSortedGuests.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  {searchTerm ? 'No guests match your search' : 'No RSVPs yet'}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-8 italic"
        >
          &ldquo;Serve one another humbly in love.&rdquo; — Galatians 5:13
        </motion.p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StatCard sub-component
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'brown' | 'sage' | 'terracotta'
  delay: number
}) {
  const colorClasses = {
    brown: 'text-brown bg-brown/10',
    sage: 'text-sage bg-sage/10',
    terracotta: 'text-terracotta bg-terracotta/10',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-warm-white rounded-xl shadow-lg p-5"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-3xl font-serif text-brown">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  )
}
