import { SessionProvider } from "next-auth/react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="p-4">
          <SessionProvider>
            <main>{children}</main>
          </SessionProvider>
    </section>
  )
}
