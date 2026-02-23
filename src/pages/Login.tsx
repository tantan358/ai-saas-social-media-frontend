import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { authApi } from '../api/auth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { EmailIcon, LockIcon } from '../components/icons/Icons'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const tokens = await authApi.login({ email, password })
      login(tokens.access_token, tokens.refresh_token)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        padding: 'var(--spacing-md)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          animation: 'float 20s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-50%',
          left: '-50%',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          animation: 'float 25s ease-in-out infinite reverse',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          position: 'relative',
          zIndex: 1,
          animation: 'fadeIn var(--transition-slow) ease-out',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--spacing-2xl)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          {/* Logo/Title Section */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: 'var(--spacing-sm)',
              }}
            >
              {t('common.welcome') || 'Welcome'}
            </h1>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9375rem',
              }}
            >
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                color: 'var(--error)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--spacing-lg)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                animation: 'fadeIn var(--transition-base) ease-out',
              }}
            >
              <svg
                style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span style={{ fontSize: '0.875rem' }}>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <Input
                type="email"
                label={t('common.email') || 'Email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                icon={<EmailIcon size={18} color="var(--gray-400)" />}
              />
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <Input
                type="password"
                label={t('common.password') || 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                icon={<LockIcon size={18} color="var(--gray-400)" />}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              style={{ width: '100%' }}
            >
              {loading ? (t('common.loading') || 'Loading...') : (t('common.login') || 'Sign In')}
            </Button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
      `}</style>
    </div>
  )
}
