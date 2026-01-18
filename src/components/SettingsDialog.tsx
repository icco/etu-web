import { useState, useMemo, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Key, CreditCard, Trash, Copy, Check, Download, ChartBar, Tag, NotePencil } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { APIKey, Note } from '@/lib/types'
import { generateId, getAllTags } from '@/lib/note-utils'
import { api, APIKeyResponse } from '@/lib/api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isApiMode?: boolean
}

export function SettingsDialog({ open, onOpenChange, isApiMode = false }: SettingsDialogProps) {
  const [localApiKeys, setLocalApiKeys] = useKV<APIKey[]>('etu-api-keys', [])
  const [apiApiKeys, setApiApiKeys] = useState<APIKeyResponse[]>([])
  const [notes] = useKV<Note[]>('etu-notes', [])
  
  // Use appropriate API keys based on mode
  const apiKeys = isApiMode 
    ? apiApiKeys.map(k => ({ id: k.id, name: k.name, createdAt: k.createdAt, lastUsed: k.lastUsed }))
    : (localApiKeys || [])

  // Fetch API keys when in API mode
  useEffect(() => {
    if (isApiMode && open) {
      api.getAPIKeys().then(setApiApiKeys).catch(console.error)
    }
  }, [isApiMode, open])
  const [newKeyName, setNewKeyName] = useState('')
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null)

  // Usage stats
  const stats = useMemo(() => {
    const noteList = notes || []
    const allTags = getAllTags(noteList)
    const totalWords = noteList.reduce((acc, note) => {
      return acc + note.content.split(/\s+/).filter(w => w.length > 0).length
    }, 0)
    const totalChars = noteList.reduce((acc, note) => acc + note.content.length, 0)
    
    // Notes per month (last 6 months)
    const now = new Date()
    const monthlyNotes: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      monthlyNotes[key] = 0
    }
    noteList.forEach(note => {
      const d = new Date(note.createdAt)
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      if (monthlyNotes[key] !== undefined) {
        monthlyNotes[key]++
      }
    })

    return {
      totalNotes: noteList.length,
      totalTags: allTags.length,
      totalWords,
      totalChars,
      monthlyNotes,
      firstNote: noteList.length > 0 
        ? new Date(Math.min(...noteList.map(n => new Date(n.createdAt).getTime())))
        : null,
    }
  }, [notes])

  // Export functionality
  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      notes: notes || [],
      apiKeys: (apiKeys || []).map(k => ({ id: k.id, name: k.name, createdAt: k.createdAt })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `etu-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Data exported successfully')
  }

  const handleExportMarkdown = () => {
    const noteList = notes || []
    let markdown = `# Etu Export\n\nExported on ${new Date().toLocaleDateString()}\n\n---\n\n`
    
    noteList.forEach(note => {
      const date = new Date(note.createdAt).toLocaleString()
      const tags = note.tags.length > 0 ? `Tags: ${note.tags.join(', ')}\n` : ''
      markdown += `## ${date}\n\n${tags}\n${note.content}\n\n---\n\n`
    })

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `etu-export-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Data exported as Markdown')
  }

  const generateLocalAPIKey = () => {
    return 'etu_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }

    if (isApiMode) {
      try {
        const result = await api.createAPIKey(newKeyName.trim())
        setApiApiKeys(prev => [...prev, result])
        setNewlyCreatedKey(result.key || null)
        setNewKeyName('')
        toast.success('API key created')
      } catch (error) {
        console.error('Failed to create API key:', error)
        toast.error('Failed to create API key')
      }
    } else {
      const newKey = generateLocalAPIKey()
      const apiKey: APIKey = {
        id: generateId(),
        name: newKeyName.trim(),
        key: newKey,
        createdAt: new Date().toISOString(),
      }

      setLocalApiKeys((currentKeys) => [...(currentKeys || []), apiKey])
      setNewlyCreatedKey(newKey)
      setNewKeyName('')
      toast.success('API key created')
    }
  }

  const confirmDeleteKey = (keyId: string) => {
    setKeyToDelete(keyId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteKey = async () => {
    if (!keyToDelete) return

    if (isApiMode) {
      try {
        await api.deleteAPIKey(keyToDelete)
        setApiApiKeys(prev => prev.filter(k => k.id !== keyToDelete))
        toast.success('API key revoked')
      } catch (error) {
        console.error('Failed to delete API key:', error)
        toast.error('Failed to revoke API key')
      }
    } else {
      setLocalApiKeys((currentKeys) => (currentKeys || []).filter((key) => key.id !== keyToDelete))
      toast.success('API key revoked')
    }
    
    setKeyToDelete(null)
    setDeleteDialogOpen(false)
  }

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key)
      setCopiedKey(key)
      toast.success('API key copied to clipboard')
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      toast.error('Failed to copy API key')
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Settings</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="api">API Keys</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your Etu account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm text-muted-foreground mt-1">demo@etu.app</p>
                  </div>
                  <div>
                    <Label>Account Created</Label>
                    <p className="text-sm text-muted-foreground mt-1">January 15, 2024</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartBar size={20} />
                    Usage Statistics
                  </CardTitle>
                  <CardDescription>Your journaling activity overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="flex justify-center mb-2">
                        <NotePencil size={24} className="text-accent" />
                      </div>
                      <div className="text-2xl font-bold text-foreground">{stats.totalNotes}</div>
                      <div className="text-sm text-muted-foreground">Total Blips</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="flex justify-center mb-2">
                        <Tag size={24} className="text-accent" />
                      </div>
                      <div className="text-2xl font-bold text-foreground">{stats.totalTags}</div>
                      <div className="text-sm text-muted-foreground">Unique Tags</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-foreground">{stats.totalWords.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Words Written</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-foreground">{stats.totalChars.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Characters</div>
                    </div>
                  </div>

                  {stats.firstNote && (
                    <div className="text-sm text-muted-foreground text-center">
                      Journaling since {stats.firstNote.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                  )}

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3">Recent Activity (Last 6 Months)</h4>
                    <div className="flex items-end gap-1 h-20">
                      {Object.entries(stats.monthlyNotes).map(([month, count]) => {
                        const maxCount = Math.max(...Object.values(stats.monthlyNotes), 1)
                        const height = (count / maxCount) * 100
                        return (
                          <div key={month} className="flex-1 flex flex-col items-center gap-1">
                            <div 
                              className="w-full bg-accent/80 rounded-t transition-all"
                              style={{ height: `${Math.max(height, 4)}%` }}
                              title={`${count} blips`}
                            />
                            <span className="text-xs text-muted-foreground">{month}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3">Export Your Data</h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" onClick={handleExportJSON} className="flex-1">
                        <Download size={16} className="mr-2" />
                        Export as JSON
                      </Button>
                      <Button variant="outline" onClick={handleExportMarkdown} className="flex-1">
                        <Download size={16} className="mr-2" />
                        Export as Markdown
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Your data belongs to you. Export anytime.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Status</CardTitle>
                  <CardDescription>Manage your Etu subscription</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Status</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-secondary text-secondary-foreground">Active</Badge>
                        <span className="text-sm text-muted-foreground">
                          Renews on January 15, 2025
                        </span>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label className="mb-2 block">Plan</Label>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-foreground">$5</span>
                      <span className="text-muted-foreground">/ year</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Button className="w-full" variant="outline">
                      <CreditCard size={20} className="mr-2" />
                      Update Payment Method
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Payment processing powered by Stripe
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Generate API keys for CLI and mobile access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Create New API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="key-name"
                        placeholder="e.g., My Laptop CLI"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
                      />
                      <Button onClick={handleCreateKey}>
                        <Key size={20} className="mr-2" />
                        Generate
                      </Button>
                    </div>
                  </div>

                  {newlyCreatedKey && (
                    <div className="bg-accent/10 border-2 border-accent rounded-lg p-4 space-y-2">
                      <p className="text-sm font-semibold text-accent-foreground">
                        Save this key! It won&apos;t be shown again.
                      </p>
                      <div className="flex items-center gap-2 bg-background rounded p-2 font-mono text-sm break-all">
                        <code className="flex-1">{newlyCreatedKey}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyKey(newlyCreatedKey)}
                        >
                          {copiedKey === newlyCreatedKey ? (
                            <Check size={16} className="text-secondary" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {(!apiKeys || apiKeys.length === 0) ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No API keys yet. Create one to get started.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <Label>Active Keys</Label>
                      {apiKeys.map((key) => (
                        <div
                          key={key.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{key.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Created {new Date(key.createdAt).toLocaleDateString()}
                              {key.lastUsed && ` • Last used ${new Date(key.lastUsed).toLocaleDateString()}`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDeleteKey(key.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke access for any applications using this key.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteKey}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
