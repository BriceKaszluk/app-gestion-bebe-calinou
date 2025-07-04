export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="p-4">
      <main>{children}</main>
    </section>
  )
}
