"use client"

import {
  ChartBarIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TagIcon,
} from "@heroicons/react/24/outline"
import { toast } from "sonner"

interface StatsViewProps {
  userStats: {
    totalBlips: number
    uniqueTags: number
    wordsWritten: number
  }
  globalStats: {
    totalBlips: number
    uniqueTags: number
    wordsWritten: number
  }
}

export function StatsView({ userStats, globalStats }: StatsViewProps) {
  const handleExportJSON = async () => {
    // This would need a server action to get all notes
    toast.info("Export functionality coming soon")
  }

  return (
    <div className="space-y-6">
      {/* User Stats Card */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title gap-2">
            <ChartBarIcon className="h-5 w-5" />
            Your Statistics
          </h2>

          <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
            <div className="stat">
              <div className="stat-figure text-primary">
                <DocumentTextIcon className="h-6 w-6" />
              </div>
              <div className="stat-title">Total Blips</div>
              <div className="stat-value">{userStats.totalBlips}</div>
            </div>
            <div className="stat">
              <div className="stat-figure text-primary">
                <TagIcon className="h-6 w-6" />
              </div>
              <div className="stat-title">Unique Tags</div>
              <div className="stat-value">{userStats.uniqueTags}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Words Written</div>
              <div className="stat-value text-2xl">{userStats.wordsWritten.toLocaleString()}</div>
            </div>
          </div>

          <div className="divider"></div>

          <div>
            <h3 className="text-sm font-medium mb-3">Export Your Data</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleExportJSON} className="btn btn-ghost gap-2">
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export as JSON
              </button>
            </div>
            <p className="text-xs text-base-content/60 mt-2">
              Your data belongs to you. Export anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Global Stats Card */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title gap-2">
            <ChartBarIcon className="h-5 w-5" />
            Global Statistics
          </h2>
          <p className="text-sm text-base-content/60 mb-4">
            Stats across all Etu users
          </p>

          <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
            <div className="stat">
              <div className="stat-figure text-secondary">
                <DocumentTextIcon className="h-6 w-6" />
              </div>
              <div className="stat-title">Total Blips</div>
              <div className="stat-value text-secondary">{globalStats.totalBlips.toLocaleString()}</div>
            </div>
            <div className="stat">
              <div className="stat-figure text-secondary">
                <TagIcon className="h-6 w-6" />
              </div>
              <div className="stat-title">Unique Tags</div>
              <div className="stat-value text-secondary">{globalStats.uniqueTags.toLocaleString()}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Words Written</div>
              <div className="stat-value text-secondary text-2xl">{globalStats.wordsWritten.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
