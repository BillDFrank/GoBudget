import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'
import { SidebarProvider } from '../context/SidebarContext'
import { SettingsProvider } from '../context/SettingsContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkAuth()
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setIsInitialized(true)
      }
    }
    
    if (!isInitialized) {
      initAuth()
    }
  }, [checkAuth, isInitialized])

  useEffect(() => {
    // Don't redirect until auth is initialized
    if (!isInitialized || isLoading) return

    // Redirect logic
    const publicPaths = ['/', '/login', '/register']
    const isPublicPath = publicPaths.includes(router.pathname)

    if (!isAuthenticated && !isPublicPath) {
      // Only redirect if not already on login page
      if (router.pathname !== '/login') {
        router.push('/login')
      }
    } else if (isAuthenticated && (router.pathname === '/login' || router.pathname === '/register')) {
      // Redirect authenticated users away from login/register pages
      router.push('/dashboard')
    }
  }, [isAuthenticated, router, isInitialized, isLoading])

  // Show loading while checking authentication
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <SettingsProvider>
      {children}
    </SettingsProvider>
  )
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <Head>
          <title>Go Budget - Personal Finance Management</title>
          <meta name="description" content="Manage your personal finances with Go Budget - track income, expenses, and savings" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="apple-touch-icon" href="/favicon.svg" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#10b981" />
          <meta name="msapplication-TileColor" content="#10b981" />
        </Head>
        <AuthWrapper>
          <Component {...pageProps} />
        </AuthWrapper>
      </SidebarProvider>
    </QueryClientProvider>
  )
}