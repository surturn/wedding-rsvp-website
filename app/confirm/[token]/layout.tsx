import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Guest Check-In | Invonics Technologies',
}

export default function ConfirmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout intentionally does NOT include the wedding Navigation or Footer.
  // The confirm page has its own Invonics-branded header/footer.
  return <>{children}</>
}
