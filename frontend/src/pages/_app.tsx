import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '../store/auth'

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { checkAuth, isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    // Redirect logic
    const publicPaths = ['/', '/login', '/register']
    const isPublicPath = publicPaths.includes(router.pathname)

    if (!isAuthenticated && !isPublicPath) {
      router.push('/login')
    } else if (isAuthenticated && (router.pathname === '/login' || router.pathname === '/register')) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  return <>{children}</>
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthWrapper>
      <Component {...pageProps} />
    </AuthWrapper>
  )
}