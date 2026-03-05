import client from './client'

export interface Campaign {
  id: string
  client_id: string
  name: string
  description?: string
  language: string
  status: string
  approved_at?: string
  created_by: string
  ai_plan?: any
  created_at: string
  updated_at?: string
}

export interface CampaignDetail extends Campaign {
  agency_name?: string
  client_name?: string
}

export interface CampaignCreate {
  name: string
  description?: string
  language: string
  client_id: string
}

export interface Post {
  id: string
  monthly_plan_id: string
  week_number: number
  title?: string
  content: string
  platform?: string
  status: string
  approved_at?: string
  published_at?: string
  published_post_id?: string
  extra_data?: Record<string, unknown>
  created_at: string
  updated_at?: string
}

export const campaignsApi = {
  getCampaigns: async (clientId?: string): Promise<Campaign[]> => {
    const params = clientId ? { client_id: clientId } : {}
    const response = await client.get('/campaigns', { params })
    return response.data
  },

  getCampaign: async (id: string): Promise<CampaignDetail> => {
    const response = await client.get(`/campaigns/${id}`)
    return response.data
  },

  createCampaign: async (data: CampaignCreate): Promise<Campaign> => {
    const response = await client.post('/campaigns', data)
    return response.data
  },

  generatePlan: async (id: string): Promise<Campaign> => {
    const response = await client.post(`/campaigns/${id}/generate-plan`)
    return response.data
  },

  approvePlan: async (id: string): Promise<Campaign> => {
    const response = await client.post(`/campaigns/${id}/approve-plan`)
    return response.data
  },

  getCampaignPosts: async (campaignId: string): Promise<Post[]> => {
    const response = await client.get(`/campaigns/${campaignId}/posts`)
    return response.data
  },
}
