import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignsApi, CampaignCreate } from '../api/campaigns'
import { useContextSelection } from '../hooks/useContextSelection'

export default function Campaigns() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { selectedClientId } = useContextSelection()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState<CampaignCreate>({
    name: '',
    description: '',
    language: 'es',
    client_id: '',
  })

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', selectedClientId],
    queryFn: () => campaignsApi.getCampaigns(selectedClientId ?? undefined),
    enabled: !!selectedClientId,
  })

  const createMutation = useMutation({
    mutationFn: campaignsApi.createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      setShowCreateForm(false)
      setFormData({ name: '', description: '', language: 'es', client_id: selectedClientId ?? '' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientId) return
    createMutation.mutate({ ...formData, client_id: selectedClientId })
  }

  if (!selectedClientId) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>{t('campaigns.title')}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Select a client in the sidebar to view and create campaigns.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>{t('campaigns.title')}</h1>
        <button
          onClick={() => {
            setFormData({ ...formData, client_id: selectedClientId })
            setShowCreateForm(!showCreateForm)
          }}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--primary, #6366f1)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {showCreateForm ? t('common.cancel') : t('campaigns.create')}
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--bg-secondary, #f8f9fa)',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ marginBottom: '1rem' }}>{t('campaigns.create')}</h2>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('campaigns.name')} *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--gray-300)',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('campaigns.description')} / Objective</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--gray-300)',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('campaigns.language')}</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value as 'es' | 'en' })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--gray-300)',
                borderRadius: '4px',
              }}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                padding: '0.5rem 1rem',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: createMutation.isPending ? 0.6 : 1,
              }}
            >
              {createMutation.isPending ? t('common.loading') : t('common.save')}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false)
                setFormData({ name: '', description: '', language: 'es', client_id: selectedClientId })
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {t('common.cancel')}
            </button>
          </div>

          {createMutation.isError && (
            <div style={{ marginTop: '1rem', color: 'red' }}>
              {t('common.error')}: {createMutation.error instanceof Error ? createMutation.error.message : 'Unknown error'}
            </div>
          )}
        </form>
      )}

      {isLoading ? (
        <p>{t('common.loading')}...</p>
      ) : campaigns && campaigns.length > 0 ? (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Campaigns</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Objective</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Language</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '0.75rem' }}>{campaign.name}</td>
                  <td style={{ padding: '0.75rem', maxWidth: 300 }}>{campaign.description || '—'}</td>
                  <td style={{ padding: '0.75rem' }}>{campaign.language.toUpperCase()}</td>
                  <td style={{ padding: '0.75rem' }}>{campaign.status}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <Link
                      to={`/campaigns/${campaign.id}`}
                      style={{ color: 'var(--primary)', textDecoration: 'none' }}
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No campaigns yet. Select a client and create your first campaign.</p>
      )}
    </div>
  )
}
