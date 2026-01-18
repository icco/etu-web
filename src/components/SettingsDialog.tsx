import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Key, CreditCard, Trash, Copy, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { APIKey } from '@/lib/types'
import { generateId } from '@/lib/note-utils'
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
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [apiKeys, setApiKeys] = useKV<APIKey[]>('etu-api-keys', [])
  const [newKeyName, setNewKeyName] = useState('')
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null)

  const generateAPIKey = () => {
    return 'etu_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }

    const newKey = generateAPIKey()
    const apiKey: APIKey = {
      id: generateId(),
      name: newKeyName.trim(),
      key: newKey,
      createdAt: new Date().toISOString(),
    }

    setApiKeys((currentKeys) => [...(currentKeys || []), apiKey])
    setNewlyCreatedKey(newKey)
    setNewKeyName('')
    toast.success('API key created')
  }

  const confirmDeleteKey = (keyId: string) => {
    setKeyToDelete(keyId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteKey = () => {
    if (keyToDelete) {
      setApiKeys((currentKeys) => (currentKeys || []).filter((key) => key.id !== keyToDelete))
      toast.success('API key revoked')
      setKeyToDelete(null)
      setDeleteDialogOpen(false)
    }
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">Account</TabsTrigger>
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
