"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  KeyIcon,
  ChartBarIcon,
  UserIcon,
  CreditCardIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TagIcon,
  PencilIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { UserMenu } from "@/components/user-menu"
import { toast } from "sonner"
import { createApiKey, deleteApiKey } from "@/lib/actions/api-keys"
import { updateProfile, changePassword } from "@/lib/actions/user"

interface SettingsViewProps {
  user: {
    id: string
    email: string | null
    name: string | null
    subscriptionStatus: string
    subscriptionEnd: Date | null
    createdAt: Date
  }
  stats: {
    totalNotes: number
    totalTags: number
    totalWords: number
    firstNoteDate: Date | null
  }
  initialApiKeys: {
    id: string
    name: string
    keyPrefix: string
    createdAt: Date
    lastUsed: Date | null
  }[]
}

export function SettingsView({ user, stats, initialApiKeys }: SettingsViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"account" | "stats" | "subscription" | "api">("account")
  const [apiKeys, setApiKeys] = useState(initialApiKeys)
  const [newKeyName, setNewKeyName] = useState("")
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Profile editing state
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(user.name || "")
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key")
      return
    }

    setIsCreating(true)
    try {
      const result = await createApiKey(newKeyName.trim())
      setNewlyCreatedKey(result.key)
      setNewKeyName("")
      router.refresh()
      toast.success("API key created")
    } catch {
      toast.error("Failed to create API key")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteKey = async (id: string) => {
    try {
      await deleteApiKey(id)
      setApiKeys((keys) => keys.filter((k) => k.id !== id))
      toast.success("API key revoked")
    } catch {
      toast.error("Failed to revoke API key")
    }
  }

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key)
      setCopiedKey(key)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleExportJSON = async () => {
    // This would need a server action to get all notes
    toast.info("Export functionality coming soon")
  }

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      toast.error("Name is required")
      return
    }

    setIsUpdatingProfile(true)
    try {
      const formData = new FormData()
      formData.set("name", editName.trim())
      const result = await updateProfile(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Profile updated")
        setIsEditingName(false)
        router.refresh()
      }
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleCancelEditName = () => {
    setEditName(user.name || "")
    setIsEditingName(false)
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters")
      return
    }

    setIsUpdatingPassword(true)
    try {
      const formData = new FormData()
      formData.set("currentPassword", currentPassword)
      formData.set("newPassword", newPassword)
      formData.set("confirmPassword", confirmPassword)
      const result = await changePassword(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Password changed successfully")
        setIsChangingPassword(false)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch {
      toast.error("Failed to change password")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setShowCurrentPassword(false)
    setShowNewPassword(false)
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <Header backHref="/notes" logoHref="/notes">
        <UserMenu />
      </Header>

      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 max-w-4xl">
        {/* Tabs */}
        <div role="tablist" className="tabs tabs-boxed mb-8">
          {[
            { id: "account", label: "Account", icon: UserIcon },
            { id: "stats", label: "Stats", icon: ChartBarIcon },
            { id: "subscription", label: "Subscription", icon: CreditCardIcon },
            { id: "api", label: "API Keys", icon: KeyIcon },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`tab gap-2 ${activeTab === id ? "tab-active" : ""}`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>

        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="space-y-6">
            {/* Profile Information Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Profile Information</h2>
                <div className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <label className="text-sm text-base-content/60">Display Name</label>
                    {isEditingName ? (
                      <div className="flex gap-2 mt-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateProfile()
                            if (e.key === "Escape") handleCancelEditName()
                          }}
                          className="input input-bordered flex-1 bg-base-100 text-base-content"
                          placeholder="Enter your name"
                          autoFocus
                        />
                        <button
                          onClick={handleUpdateProfile}
                          disabled={isUpdatingProfile}
                          className="btn btn-primary btn-sm"
                        >
                          {isUpdatingProfile ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <CheckIcon className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={handleCancelEditName}
                          disabled={isUpdatingProfile}
                          className="btn btn-ghost btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="py-2">{user.name || "Not set"}</p>
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="btn btn-ghost btn-sm gap-2"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Email Field (read-only) */}
                  <div>
                    <label className="text-sm text-base-content/60">Email</label>
                    <p className="py-2">{user.email}</p>
                  </div>

                  {/* User ID Field (read-only) */}
                  <div>
                    <label className="text-sm text-base-content/60">User ID</label>
                    <p className="font-mono text-sm py-2">{user.id}</p>
                  </div>

                  {/* Account Created Field (read-only) */}
                  <div>
                    <label className="text-sm text-base-content/60">Account Created</label>
                    <p className="py-2" suppressHydrationWarning>
                      {format(new Date(user.createdAt), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title gap-2">
                  <LockClosedIcon className="h-5 w-5" />
                  Security
                </h2>

                {isChangingPassword ? (
                  <div className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="text-sm font-medium">Current Password</label>
                      <div className="relative mt-1">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="input input-bordered w-full bg-base-100 text-base-content pr-10"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
                        >
                          {showCurrentPassword ? (
                            <EyeSlashIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="text-sm font-medium">New Password</label>
                      <div className="relative mt-1">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="input input-bordered w-full bg-base-100 text-base-content pr-10"
                          placeholder="Enter new password (min. 8 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
                        >
                          {showNewPassword ? (
                            <EyeSlashIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="text-sm font-medium">Confirm New Password</label>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                        className="input input-bordered w-full bg-base-100 text-base-content mt-1"
                        placeholder="Confirm new password"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleChangePassword}
                        disabled={isUpdatingPassword}
                        className="btn btn-primary gap-2"
                      >
                        {isUpdatingPassword ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          <CheckIcon className="h-5 w-5" />
                        )}
                        Update Password
                      </button>
                      <button
                        onClick={handleCancelPasswordChange}
                        disabled={isUpdatingPassword}
                        className="btn btn-ghost"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-base-content/60 mb-4">
                      Keep your account secure by using a strong password.
                    </p>
                    <button
                      onClick={() => setIsChangingPassword(true)}
                      className="btn btn-ghost gap-2"
                    >
                      <LockClosedIcon className="h-5 w-5" />
                      Change Password
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title gap-2">
                <ChartBarIcon className="h-5 w-5" />
                Usage Statistics
              </h2>

              <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
                <div className="stat">
                  <div className="stat-figure text-primary">
                    <DocumentTextIcon className="h-6 w-6" />
                  </div>
                  <div className="stat-title">Total Blips</div>
                  <div className="stat-value">{stats.totalNotes}</div>
                </div>
                <div className="stat">
                  <div className="stat-figure text-primary">
                    <TagIcon className="h-6 w-6" />
                  </div>
                  <div className="stat-title">Unique Tags</div>
                  <div className="stat-value">{stats.totalTags}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Words Written</div>
                  <div className="stat-value text-2xl">{stats.totalWords.toLocaleString()}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">First Blip</div>
                  <div className="stat-value text-2xl" suppressHydrationWarning>
                    {stats.firstNoteDate
                      ? format(new Date(stats.firstNoteDate), "MMM yyyy")
                      : "—"}
                  </div>
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
        )}

        {/* Subscription Tab */}
        {activeTab === "subscription" && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Subscription</h2>
              <div className="flex items-center gap-4">
                <span
                  className={`badge ${user.subscriptionStatus === "active"
                    ? "badge-success"
                    : user.subscriptionStatus === "trial"
                      ? "bg-warning text-black"
                      : "badge-ghost"
                    }`}
                >
                  {user.subscriptionStatus.charAt(0).toUpperCase() + user.subscriptionStatus.slice(1)}
                </span>
                {user.subscriptionEnd && (
                  <span className="text-sm text-base-content/60" suppressHydrationWarning>
                    {user.subscriptionStatus === "active" ? "Renews" : "Ends"}{" "}
                    {format(new Date(user.subscriptionEnd), "MMMM d, yyyy")}
                  </span>
                )}
              </div>

              <div className="divider"></div>

              <div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold">$5</span>
                  <span className="text-base-content/60">/ year</span>
                </div>
                <button className="btn btn-ghost w-full gap-2">
                  <CreditCardIcon className="h-5 w-5" />
                  Manage Subscription
                </button>
                <p className="text-xs text-base-content/60 text-center mt-2">
                  Powered by Stripe
                </p>
              </div>
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === "api" && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div>
                <h2 className="card-title">API Keys</h2>
                <p className="text-sm text-base-content/60">
                  Generate API keys for CLI and mobile access
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Create New API Key</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
                    placeholder="e.g., My Laptop CLI"
                    className="input input-bordered flex-1 bg-base-100 text-base-content placeholder:text-base-content/50"
                  />
                  <button
                    onClick={handleCreateKey}
                    disabled={isCreating}
                    className="btn btn-primary gap-2"
                  >
                    {isCreating ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <KeyIcon className="h-5 w-5" />
                    )}
                    Generate
                  </button>
                </div>
              </div>

              {newlyCreatedKey && (
                <div className="alert alert-success">
                  <div className="flex flex-col gap-2 w-full">
                    <p className="text-sm font-semibold">
                      Save this key! It won&apos;t be shown again.
                    </p>
                    <div className="flex items-center gap-2 bg-base-100 rounded p-2 font-mono text-sm break-all">
                      <code className="flex-1">{newlyCreatedKey}</code>
                      <button
                        onClick={() => handleCopyKey(newlyCreatedKey)}
                        className="btn btn-ghost btn-sm btn-square"
                      >
                        {copiedKey === newlyCreatedKey ? (
                          <CheckIcon className="h-4 w-4 text-success" />
                        ) : (
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="divider"></div>

              {apiKeys.length === 0 ? (
                <p className="text-sm text-base-content/60 text-center py-4">
                  No API keys yet. Create one to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Active Keys</label>
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{key.name}</p>
                        <p className="text-xs text-base-content/60" suppressHydrationWarning>
                          {key.keyPrefix}... • Created{" "}
                          {format(new Date(key.createdAt), "MMM d, yyyy")}
                          {key.lastUsed &&
                            ` • Last used ${format(new Date(key.lastUsed), "MMM d")}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="btn btn-ghost btn-sm btn-square text-error"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
