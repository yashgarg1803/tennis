'use client'

import Link from 'next/link'
import { Shield, Users, Mail, Lock, Home, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const { user, loading, signInWithGoogle, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push('/profile')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="container py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="container py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-secondary">Redirecting to profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-20">
      <div style={{ maxWidth: '28rem', margin: '0 auto' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield />
            <span className="text-2xl font-bold">Sequential Blotto</span>
          </div>
          <p className="text-secondary">Sign in to your account</p>
        </div>

        {/* Sign In Card */}
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">Welcome Back</h3>
            <p className="card-description">
              Sign in to access your profile, match history, and multiplayer features
            </p>
          </div>
          <div className="card-content">
            <button onClick={signInWithGoogle} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              <Users />
              Continue with Google
            </button>
            
            <div className="text-center mt-4">
              <p className="text-sm text-secondary">
                By signing in, you agree to our terms of service and privacy policy
              </p>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">Account Features</h3>
            <p className="card-description">
              What you'll get with an account
            </p>
          </div>
          <div className="card-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="flex items-center gap-3">
                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                <span className="text-sm">Match history & statistics</span>
              </div>
              <div className="flex items-center gap-3">
                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                <span className="text-sm">Multiplayer game rooms</span>
              </div>
              <div className="flex items-center gap-3">
                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                <span className="text-sm">Friends list & challenges</span>
              </div>
              <div className="flex items-center gap-3">
                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                <span className="text-sm">Leaderboards & achievements</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link href="/play/single" className="btn btn-ghost" style={{ width: '100%' }}>
            <Shield />
            Play Single Player (No Account Required)
          </Link>
          
          <Link href="/" className="btn btn-ghost btn-sm">
            <Home />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
} 