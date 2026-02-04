import type { Metadata } from "next"
import { getUserStats, getGlobalStats } from "@/lib/actions/stats"
import { getApiKeys } from "@/lib/actions/api-keys"
import { getCurrentUser } from "@/lib/auth"
import { SettingsView } from "./settings-view"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Settings | Etu",
}

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [userStats, globalStats, apiKeys] = await Promise.all([
    getUserStats(),
    getGlobalStats(),
    getApiKeys(),
  ])

  return (
    <SettingsView
      user={user}
      userStats={userStats}
      globalStats={globalStats}
      initialApiKeys={apiKeys}
    />
  )
}
