import type { Metadata } from "next"
import { getUserStats, getGlobalStats } from "@/lib/actions/stats"
import { StatsView } from "./stats-view"

export const metadata: Metadata = {
  title: "Statistics | Etu",
}

export default async function StatsPage() {
  const [userStats, globalStats] = await Promise.all([
    getUserStats(),
    getGlobalStats(),
  ])

  return <StatsView userStats={userStats} globalStats={globalStats} />
}
