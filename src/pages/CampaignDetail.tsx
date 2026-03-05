import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignsApi, Post } from '../api/campaigns'
import { postsApi } from '../api/posts'

export default function CampaignDetail() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignsApi.getCampaign(campaignId!),
    enabled: !!campaignId,
  })

  const { data: posts = [] } = useQuery({
    queryKey: ['campaign-posts', campaignId],
    queryFn: () => campaignsApi.getCampaignPosts(campaignId!),
    enabled: !!campaignId && (campaign?.status === 'planning_generated' || campaign?.status === 'planning_approved'),
  })

  const generatePlanMutation = useMutation({
    mutationFn: () => campaignsApi.generatePlan(campaignId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['campaign-posts', campaignId] })
    },
  })

  const approvePlanMutation = useMutation({
    mutationFn: () => campaignsApi.approvePlan(campaignId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['campaign-posts', campaignId] })
    },
  })

  const updatePostMutation = useMutation({
    mutationFn: ({ id, title, content }: { id: string; title?: string; content?: string }) =>
      postsApi.updatePost(id, { title, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-posts', campaignId] })
      setEditingPost(null)
    },
  })

  const openEditModal = (post: Post) => {
    if (campaign?.status === 'planning_approved') return
    setEditingPost(post)
    setEditTitle(post.title ?? '')
    setEditContent(post.content)
  }

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPost) return
    updatePostMutation.mutate({
      id: editingPost.id,
      title: editTitle || undefined,
      content: editContent,
    })
  }

  const postsByWeek = (() => {
    const map: Record<number, Post[]> = { 1: [], 2: [], 3: [], 4: [] }
    posts.forEach((p) => {
      const w = Math.min(4, Math.max(1, p.week_number))
      if (!map[w]) map[w] = []
      map[w].push(p)
    })
    return map
  })()

  if (!campaignId || isLoading || !campaign) {
    return (
      <div style={{ padding: '2rem' }}>
        {isLoading ? <p>{t('common.loading')}...</p> : <p>Campaign not found.</p>}
      </div>
    )
  }

  const canGenerate = campaign.status === 'draft'
  const canApprove = campaign.status === 'planning_generated'
  const isLocked = campaign.status === 'planning_approved'

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => navigate('/campaigns')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            cursor: 'pointer',
            marginBottom: '0.5rem',
          }}
        >
          ← Back to campaigns
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {campaign.agency_name && <span>{campaign.agency_name}</span>}
          {campaign.agency_name && campaign.client_name && ' · '}
          {campaign.client_name && <span>{campaign.client_name}</span>}
        </div>
        <h1 style={{ marginTop: '0.25rem' }}>{campaign.name}</h1>
        {campaign.description && (
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{campaign.description}</p>
        )}
        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
          Language: <strong>{campaign.language.toUpperCase()}</strong> · Status: <strong>{campaign.status}</strong>
        </div>
      </div>

      {canGenerate && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => generatePlanMutation.mutate()}
            disabled={generatePlanMutation.isPending}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'var(--primary, #6366f1)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: generatePlanMutation.isPending ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {generatePlanMutation.isPending ? 'Generating...' : 'Generate Monthly Plan (AI)'}
          </button>
          {generatePlanMutation.isError && (
            <div style={{ marginTop: '0.5rem', color: 'var(--error)' }}>
              {(generatePlanMutation.error as Error)?.message ?? 'Failed to generate plan'}
            </div>
          )}
        </div>
      )}

      {(campaign.status === 'planning_generated' || campaign.status === 'planning_approved') && (
        <>
          <h2 style={{ marginBottom: '1rem' }}>Monthly plan – Weeks 1–4</h2>
          {[1, 2, 3, 4].map((week) => (
            <div
              key={week}
              style={{
                border: '1px solid var(--gray-200)',
                borderRadius: '8px',
                marginBottom: '1rem',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--gray-50)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Week {week}
              </div>
              <div style={{ padding: '1rem' }}>
                {(postsByWeek[week] ?? []).length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No posts</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {(postsByWeek[week] ?? []).map((post) => (
                      <li
                        key={post.id}
                        onClick={() => openEditModal(post)}
                        style={{
                          padding: '0.75rem',
                          marginBottom: '0.5rem',
                          background: 'var(--bg-secondary)',
                          borderRadius: '6px',
                          cursor: isLocked ? 'default' : 'pointer',
                          border: '1px solid var(--gray-200)',
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                          {post.title || 'Untitled'} {post.platform && `· ${post.platform}`}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                          {post.content.slice(0, 120)}
                          {post.content.length > 120 ? '...' : ''}
                        </div>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Status: {post.status}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}

          {canApprove && (
            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => approvePlanMutation.mutate()}
                disabled={approvePlanMutation.isPending}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: approvePlanMutation.isPending ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                {approvePlanMutation.isPending ? 'Approving...' : 'Approve Monthly Plan'}
              </button>
            </div>
          )}

          {isLocked && (
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Plan approved. Editing is locked.
            </p>
          )}
        </>
      )}

      {editingPost && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => !updatePostMutation.isPending && setEditingPost(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: 500,
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Edit post</h3>
            <form onSubmit={handleSavePost}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '6px',
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '6px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={updatePostMutation.isPending}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: updatePostMutation.isPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {updatePostMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--gray-200)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
