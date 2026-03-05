import client from './client'

export interface Agency {
  id: string
  name: string
  slug?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export const agenciesApi = {
  getMe: async (): Promise<Agency> => {
    const response = await client.get('/agencies/me')
    return response.data
  },
}
