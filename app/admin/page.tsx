'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Loader2
} from 'lucide-react'
import { HandSignIcon } from '@/components/hand-sign-icon'

interface RSVP {
  id: number
  name: string
  phone: string
  attending: boolean
  guestCount: number
  message: string
  createdAt: string
}

type SortField = 'name' | 'phone' | 'attending' | 'guestCount' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export default function AdminPage() {
  const prefersReducedMotion = useReducedMotion()
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Check localStorage for auth on mount
  useEffect(() => {
    const authKey = localStorage.getItem('admin_auth')
    if (authKey === 'authenticated') {
      setIsAuthenticated(true)
    }
    setIsCheckingAuth(false)
  }, [])

  // Fetch RSVPs when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchRSVPs()
    }
  }, [isAuthenticated])

  const fetchRSVPs = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/admin/guests')
      
      if (!response.ok) {
        throw new Error('Failed to fetch RSVPs')
      }
      
      const data = await response.json()
      // Server route already extracts the .list array for us
      const rsvpList = data.guests || []
      setRsvps(rsvpList.map((item: Record<string, unknown>, index: number) => ({
        id: item.Id || item.id || index,
        name: item.name || item.Name || '',
        phone: item.phone || item.Phone || '',
        attending: item.attending === true || item.attending === 'true' || item.Attending === true,
        guestCount: Number(item.guestCount || item.GuestCount || item.guest_count || 0),
        message: item.message || item.Message || '',
        createdAt: item.createdAt || item.CreatedAt || item.created_at || new Date().toISOString()
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load RSVPs')
    } finally {
      setIsLoading(false)
    }
  }

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

      localStorage.setItem('admin_auth', 'authenticated')
      setIsAuthenticated(true)
      setPasswordError('')
    } catch {
      setPasswordError('Authentication failed. Please try again.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_auth')
    setIsAuthenticated(false)
    setRsvps([])
  }

  // Calculate stats
  const stats = useMemo(() => {
    const attending = rsvps.filter(r => r.attending)
    const notAttending = rsvps.filter(r => !r.attending)
    const totalGuests = attending.reduce((sum, r) => sum + (r.guestCount || 1), 0)
    
    return {
      total: rsvps.length,
      attending: attending.length,
      notAttending: notAttending.length,
      totalGuests
    }
  }, [rsvps])

  // Filter and sort RSVPs
  const filteredAndSortedRsvps = useMemo(() => {
    let filtered = rsvps.filter(rsvp => 
      rsvp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rsvp.phone.includes(searchTerm) ||
      rsvp.message.toLowerCase().includes(searchTerm.toLowerCase())
    )

    filtered.sort((a, b) => {
      let aVal: string | number | boolean = a[sortField]
      let bVal: string | number | boolean = b[sortField]
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [rsvps, searchTerm, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 inline ml-1" />
      : <ChevronDown className="w-4 h-4 inline ml-1" />
  }

  // Chart calculations
  const chartData = useMemo(() => {
    const total = stats.attending + stats.notAttending
    if (total === 0) return { attendingPercent: 0, notAttendingPercent: 0 }
    return {
      attendingPercent: Math.round((stats.attending / total) * 100),
      notAttendingPercent: Math.round((stats.notAttending / total) * 100)
    }
  }, [stats])

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
      </div>
    )
  }

  // Password gate screen
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
                  onChange={(e) => {
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

  // Dashboard
  return (
    <div className="min-h-screen bg-cream py-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
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
              <p className="text-muted-foreground text-sm">Manuh & Anne&apos;s Wedding RSVPs</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="self-start sm:self-auto px-4 py-2 text-sm text-muted-foreground hover:text-brown border border-border rounded-lg hover:bg-cream transition-colors"
          >
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
              <button 
                onClick={fetchRSVPs}
                className="ml-auto text-sm underline hover:no-underline"
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <StatCard 
            icon={<Users className="w-5 h-5" />}
            label="Total RSVPs"
            value={stats.total}
            color="brown"
            delay={0}
          />
          <StatCard 
            icon={<CheckCircle className="w-5 h-5" />}
            label="Attending"
            value={stats.attending}
            color="sage"
            delay={0.1}
          />
          <StatCard 
            icon={<XCircle className="w-5 h-5" />}
            label="Not Attending"
            value={stats.notAttending}
            color="terracotta"
            delay={0.2}
          />
          <StatCard 
            icon={<UserPlus className="w-5 h-5" />}
            label="Total Guests"
            value={stats.totalGuests}
            color="sage"
            delay={0.3}
          />
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
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="20"
                  />
                  {/* Attending segment */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="var(--sage)"
                    strokeWidth="20"
                    strokeDasharray={`${chartData.attendingPercent * 2.51} 251`}
                    initial={{ strokeDasharray: "0 251" }}
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

              {/* Bar representation */}
              <div className="flex-1 w-full md:w-auto">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-brown">Attending</span>
                      <span className="text-muted-foreground">{chartData.attendingPercent}%</span>
                    </div>
                    <div className="h-3 bg-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-sage rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${chartData.attendingPercent}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-brown">Not Attending</span>
                      <span className="text-muted-foreground">{chartData.notAttendingPercent}%</span>
                    </div>
                    <div className="h-3 bg-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-terracotta rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${chartData.notAttendingPercent}%` }}
                        transition={{ duration: 1, delay: 0.6 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* RSVP Table */}
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
              
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-cream/50 focus:outline-none focus:ring-2 focus:ring-terracotta/50 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-cream/50 text-sm text-muted-foreground">
                    <tr>
                      <th 
                        className="text-left px-4 py-3 font-medium cursor-pointer hover:text-brown transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        Name <SortIcon field="name" />
                      </th>
                      <th 
                        className="text-left px-4 py-3 font-medium cursor-pointer hover:text-brown transition-colors"
                        onClick={() => handleSort('phone')}
                      >
                        Phone <SortIcon field="phone" />
                      </th>
                      <th 
                        className="text-left px-4 py-3 font-medium cursor-pointer hover:text-brown transition-colors"
                        onClick={() => handleSort('attending')}
                      >
                        Attending <SortIcon field="attending" />
                      </th>
                      <th 
                        className="text-left px-4 py-3 font-medium cursor-pointer hover:text-brown transition-colors"
                        onClick={() => handleSort('guestCount')}
                      >
                        Guests <SortIcon field="guestCount" />
                      </th>
                      <th className="text-left px-4 py-3 font-medium">Message</th>
                      <th 
                        className="text-left px-4 py-3 font-medium cursor-pointer hover:text-brown transition-colors"
                        onClick={() => handleSort('createdAt')}
                      >
                        Date <SortIcon field="createdAt" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAndSortedRsvps.map((rsvp) => (
                      <motion.tr 
                        key={rsvp.id} 
                        className="hover:bg-cream/30 transition-colors"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <td className="px-4 py-4">
                          <p className="font-medium text-brown">{rsvp.name}</p>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {rsvp.phone || '-'}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            rsvp.attending 
                              ? 'bg-sage/20 text-sage' 
                              : 'bg-terracotta/20 text-terracotta'
                          }`}>
                            {rsvp.attending ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-brown">
                          {rsvp.attending ? rsvp.guestCount : '-'}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground max-w-xs truncate">
                          {rsvp.message || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {new Date(rsvp.createdAt).toLocaleDateString()}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {filteredAndSortedRsvps.length === 0 && !isLoading && (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchTerm ? 'No RSVPs match your search' : 'No RSVPs yet'}
                  </div>
                )}
              </div>
            </>
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

function StatCard({ icon, label, value, color, delay }: { 
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
