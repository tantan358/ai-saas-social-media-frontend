import client from './client'

export interface Campaign {
  id: string
  name: string
  description?: string
  language: string
  status: string
  tenant_id: string
  created_by: string
  ai_plan?: any
  created_at: string
  updated_at?: string
}

export interface CampaignCreate {
  name: string
  description?: string
  language: string
}

export const campaignsApi = {
  getCampaigns: async (): Promise<Campaign[]> => {
    const response = await client.get('/campaigns')
    return response.data
  },
  
  getCampaign: async (id: number): Promise<Campaign> => {
    const response = await client.get(`/campaigns/${id}`)
    return response.data
  },
  
  createCampaign: async (data: CampaignCreate): Promise<Campaign> => {
    const response = await client.post('/campaigns', data)
    return response.data
  },
  
  generatePlan: async (id: number): Promise<Campaign> => {
    const response = await client.post(`/campaigns/${id}/generate-plan`)
    return response.data
  },
  
  approvePlan: async (id: number, approved: boolean, comments?: string): Promise<any> => {
    const response = await client.post(`/campaigns/${id}/approve-plan`, {
      approved,
      comments
    })
    return response.data
  },
  
  generatePosts: async (id: number): Promise<any[]> => {
    const response = await client.post(`/campaigns/${id}/generate-posts`)
    return response.data
  },
}
