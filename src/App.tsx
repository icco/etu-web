import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { LandingPage } from '@/components/LandingPage'
import { AppView } from '@/components/AppView'
import { Toaster } from '@/components/ui/sonner'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useKV<boolean>('etu-authenticated', false)

  const handleGetStarted = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  return (
    <>
      {isAuthenticated ? (
        <AppView onLogout={handleLogout} />
      ) : (
        <LandingPage onGetStarted={handleGetStarted} />
      )}
      <Toaster position="top-right" />
    </>
  )
}

export default App