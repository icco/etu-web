import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { LandingPage } from '@/components/LandingPage'
import { AppView } from '@/components/AppView'
import { AuthDialog } from '@/components/AuthDialog'
import { Toaster } from '@/components/ui/sonner'
import { api } from '@/lib/api'
import { toast } from 'sonner'

// Check if API server is available
async function checkApiAvailable(): Promise<boolean> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function App() {
  // Local storage fallback (when API not available)
  const [localAuth, setLocalAuth] = useKV<boolean>('etu-authenticated', false)
  
  // API mode state
  const [isApiMode, setIsApiMode] = useState<boolean | null>(null)
  const [isApiAuthenticated, setIsApiAuthenticated] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check API availability on mount
  useEffect(() => {
    const init = async () => {
      const apiAvailable = await checkApiAvailable()
      setIsApiMode(apiAvailable)

      if (apiAvailable && api.getToken()) {
        try {
          await api.getMe()
          setIsApiAuthenticated(true)
        } catch {
          api.logout()
        }
      }
      setIsLoading(false)
    }

    init()
  }, [])

  const isAuthenticated = isApiMode ? isApiAuthenticated : localAuth

  const handleGetStarted = () => {
    if (isApiMode) {
      setAuthDialogOpen(true)
    } else {
      setLocalAuth(true)
    }
  }

  const handleLogin = async (email: string, password: string) => {
    await api.login(email, password)
    setIsApiAuthenticated(true)
    toast.success('Welcome back!')
  }

  const handleRegister = async (email: string, password: string) => {
    await api.register(email, password)
    setIsApiAuthenticated(true)
    toast.success('Account created!')
  }

  const handleLogout = () => {
    if (isApiMode) {
      api.logout()
      setIsApiAuthenticated(false)
    } else {
      setLocalAuth(false)
    }
  }

  // Show loading state
  if (isLoading || isApiMode === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {isAuthenticated ? (
        <AppView onLogout={handleLogout} isApiMode={isApiMode} />
      ) : (
        <LandingPage onGetStarted={handleGetStarted} />
      )}
      
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
      
      <Toaster position="top-right" />
    </>
  )
}

export default App