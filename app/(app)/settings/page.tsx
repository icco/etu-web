import { getStats } from "@/lib/actions/notes"
import { getApiKeys } from "@/lib/actions/api-keys"
import { getUserSettings } from "@/lib/actions/user"
import { getCurrentUser } from "@/lib/auth"
import { SettingsView } from "./settings-view"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [stats, apiKeys, userSettings] = await Promise.all([
    getStats(),
    getApiKeys(),
    getUserSettings(),
  ])

  return (
    <SettingsView
      user={user}
      stats={stats}
      initialApiKeys={apiKeys}
      userSettings={userSettings}
    />
  )
}
