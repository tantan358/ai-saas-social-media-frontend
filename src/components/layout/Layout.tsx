import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'
import { DashboardIcon, CampaignIcon, SocialIcon, SettingsIcon } from '../icons/Icons'

export default function Layout() {
  const { t, i18n } = useTranslation()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const navItems = [
    { path: '/', label: t('dashboard.title'), icon: DashboardIcon },
    { path: '/campaigns', label: t('campaigns.title'), icon: CampaignIcon },
    { path: '/social-accounts', label: 'Social Accounts', icon: SocialIcon },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      {/* Modern Sidebar */}
      <aside
        style={{
          width: '260px',
          background: 'var(--bg-primary)',
          borderRight: '1px solid var(--gray-200)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-sm)',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        {/* Logo/Brand */}
        <div
          style={{
            padding: 'var(--spacing-xl)',
            borderBottom: '1px solid var(--gray-200)',
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Nervia AI
          </h2>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: 'var(--spacing-md)' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map((item) => {
              const IconComponent = item.icon
              return (
                <li key={item.path} style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <Link
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-md)',
                      padding: 'var(--spacing-md)',
                      borderRadius: 'var(--radius-lg)',
                      textDecoration: 'none',
                      color: isActive(item.path) ? 'var(--primary)' : 'var(--text-secondary)',
                      background: isActive(item.path)
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
                        : 'transparent',
                      fontWeight: isActive(item.path) ? 600 : 400,
                      transition: 'all var(--transition-base)',
                      border: isActive(item.path) ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(item.path)) {
                        e.currentTarget.style.background = 'var(--gray-50)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(item.path)) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }
                    }}
                  >
                    <IconComponent size={20} color={isActive(item.path) ? 'var(--primary)' : 'var(--text-secondary)'} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Language Selector */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderTop: '1px solid var(--gray-200)',
            borderBottom: '1px solid var(--gray-200)',
          }}
        >
          <div
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 500,
            }}
          >
            Language
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button
              onClick={() => changeLanguage('es')}
              style={{
                flex: 1,
                padding: 'var(--spacing-sm) var(--spacing-md)',
                background:
                  i18n.language === 'es'
                    ? 'var(--gradient-primary)'
                    : 'var(--bg-secondary)',
                color: i18n.language === 'es' ? 'white' : 'var(--text-primary)',
                border: `1px solid ${i18n.language === 'es' ? 'transparent' : 'var(--gray-300)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: i18n.language === 'es' ? 600 : 400,
                transition: 'all var(--transition-base)',
              }}
            >
              ES
            </button>
            <button
              onClick={() => changeLanguage('en')}
              style={{
                flex: 1,
                padding: 'var(--spacing-sm) var(--spacing-md)',
                background:
                  i18n.language === 'en'
                    ? 'var(--gradient-primary)'
                    : 'var(--bg-secondary)',
                color: i18n.language === 'en' ? 'white' : 'var(--text-primary)',
                border: `1px solid ${i18n.language === 'en' ? 'transparent' : 'var(--gray-300)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: i18n.language === 'en' ? 600 : 400,
                transition: 'all var(--transition-base)',
              }}
            >
              EN
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div style={{ padding: 'var(--spacing-md)' }}>
          <Button
            variant="outline"
            size="md"
            onClick={handleLogout}
            style={{ width: '100%' }}
          >
            {t('common.logout') || 'Logout'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: 'var(--spacing-2xl)',
          overflowY: 'auto',
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <Outlet />
      </main>
    </div>
  )
}
