import { SettingsNav } from "@/components/settings-nav"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex-1 container mx-auto px-4 md:px-6 py-8 max-w-4xl">
      <SettingsNav />
      {children}
    </main>
  )
}
