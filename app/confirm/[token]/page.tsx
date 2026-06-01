import { notFound } from 'next/navigation'
import { fetchGuestByToken } from '@/lib/nocodb'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Guest Check-In | Invonics Technologies',
  description: 'Guest confirmation and check-in page',
}

interface ConfirmPageProps {
  params: Promise<{ token: string }>
}

export default async function ConfirmPage({ params }: ConfirmPageProps) {
  const { token } = await params

  const guest = await fetchGuestByToken(token)

  if (!guest) {
    notFound()
  }

  // Determine status
  const isAttending = guest.attending
  const isCheckedIn = guest.CheckedIn

  let statusBanner: { bg: string; icon: string; text: string }

  if (!isAttending) {
    statusBanner = {
      bg: 'bg-red-500',
      icon: '✘',
      text: 'Not attending',
    }
  } else if (isCheckedIn) {
    const checkedInTime = guest.CheckedInAt
      ? new Date(guest.CheckedInAt).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'earlier'
    statusBanner = {
      bg: 'bg-amber-500',
      icon: '⚠',
      text: `Already checked in at ${checkedInTime}`,
    }
  } else {
    statusBanner = {
      bg: 'bg-emerald-500',
      icon: '✔',
      text: `Welcome, ${guest.name}!`,
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Invonics Header */}
      <header className="bg-[#0D1B4B] text-white px-4 py-4">
        <div className="max-w-sm mx-auto">
          <p className="text-[#C9A84C] font-serif text-sm tracking-widest uppercase">
            Invonics Technologies
          </p>
          <h1 className="text-lg font-semibold mt-0.5">Guest Check-In</h1>
        </div>
      </header>

      {/* Status Banner */}
      <div className={`${statusBanner.bg} text-white px-4 py-3`}>
        <div className="max-w-sm mx-auto flex items-center gap-2 text-base font-medium">
          <span className="text-lg">{statusBanner.icon}</span>
          <span>{statusBanner.text}</span>
        </div>
      </div>

      {/* Guest Details Card */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-sm mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 space-y-5">
            {/* Name */}
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                Guest Name
              </p>
              <p className="text-2xl font-serif text-gray-900">{guest.name}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              {guest.Email && (
                <div className="col-span-2">
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                    Email
                  </p>
                  <p className="text-sm text-gray-700 break-all">{guest.Email}</p>
                </div>
              )}

              {guest.phone && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                    Phone
                  </p>
                  <p className="text-sm text-gray-700">{guest.phone}</p>
                </div>
              )}

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                  Guest Count
                </p>
                <p className="text-sm text-gray-700">
                  {guest.guestCount} {guest.guestCount === 1 ? 'person' : 'people'}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                  Attendance
                </p>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    isAttending
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {isAttending ? 'Attending' : 'Declined'}
                </span>
              </div>
            </div>

            {/* Message */}
            {guest.message && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                  Message
                </p>
                <p className="text-sm text-gray-600 italic leading-relaxed">
                  &ldquo;{guest.message}&rdquo;
                </p>
              </div>
            )}

            {/* Check-in status */}
            {isCheckedIn && guest.CheckedInAt && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                  Checked In At
                </p>
                <p className="text-sm text-gray-700">
                  {new Date(guest.CheckedInAt).toLocaleString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-4 text-center">
        <p className="text-xs text-gray-400">
          Powered by{' '}
          <span className="text-[#0D1B4B] font-medium">Invonics Technologies</span>
        </p>
      </footer>
    </div>
  )
}
