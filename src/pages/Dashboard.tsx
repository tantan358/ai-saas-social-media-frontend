import { useTranslation } from 'react-i18next'
import Card from '../components/ui/Card'
import { ActiveCampaignIcon, ScheduledIcon, PublishedIcon, CreateCampaignIcon, ConnectAccountIcon } from '../components/icons/Icons'

export default function Dashboard() {
  const { t } = useTranslation()

  const stats = [
    {
      title: t('dashboard.activeCampaigns') || 'Active Campaigns',
      value: '0',
      icon: ActiveCampaignIcon,
      color: 'var(--primary)',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: t('dashboard.scheduledPosts') || 'Scheduled Posts',
      value: '0',
      icon: ScheduledIcon,
      color: 'var(--secondary)',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      title: t('dashboard.publishedPosts') || 'Published Posts',
      value: '0',
      icon: PublishedIcon,
      color: 'var(--success)',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
  ]

  return (
    <div style={{ animation: 'fadeIn var(--transition-slow) ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          {t('dashboard.title') || 'Dashboard'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Welcome back! Here's what's happening with your campaigns.
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-2xl)',
        }}
      >
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <Card
              key={index}
              hover
              gradient
              style={{
                animation: `fadeIn var(--transition-base) ease-out ${index * 0.1}s both`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      marginBottom: 'var(--spacing-sm)',
                      fontWeight: 500,
                    }}
                  >
                    {stat.title}
                  </p>
                  <p
                    style={{
                      fontSize: '2.5rem',
                      fontWeight: 700,
                      background: stat.gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: 'var(--radius-xl)',
                    background: stat.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-md)',
                    color: 'white',
                  }}
                >
                  <IconComponent size={28} color="white" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          Quick Actions
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          <button
            style={{
              padding: 'var(--spacing-lg)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              transition: 'all var(--transition-base)',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--gray-50)'
              e.currentTarget.style.borderColor = 'var(--primary)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)'
              e.currentTarget.style.borderColor = 'var(--gray-200)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--primary)' }}>
              <CreateCampaignIcon size={24} color="var(--primary)" />
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Create Campaign</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              Start a new marketing campaign
            </div>
          </button>
          <button
            style={{
              padding: 'var(--spacing-lg)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              transition: 'all var(--transition-base)',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--gray-50)'
              e.currentTarget.style.borderColor = 'var(--primary)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)'
              e.currentTarget.style.borderColor = 'var(--gray-200)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--primary)' }}>
              <ConnectAccountIcon size={24} color="var(--primary)" />
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Connect Account</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              Link your social media accounts
            </div>
          </button>
        </div>
      </Card>
    </div>
  )
}
