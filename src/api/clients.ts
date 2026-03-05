import client from './client'

export interface Client {
  id: string
  agency_id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface ClientCreate {
  name: string
}

export const clientsApi = {
  list: async (): Promise<Client[]> => {
    const response = await client.get('/clients')
    return response.data
  },

  create: async (data: ClientCreate): Promise<Client> => {
    const response = await client.post('/clients', data)
    return response.data
  },
}
