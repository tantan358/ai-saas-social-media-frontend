import client from './client'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  full_name: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export const authApi = {
  login: async (data: LoginData): Promise<TokenResponse> => {
    const response = await client.post('/auth/login', data)
    return response.data
  },
  
  register: async (data: RegisterData): Promise<any> => {
    const response = await client.post('/auth/register', data)
    return response.data
  },
  
  getMe: async (): Promise<any> => {
    const response = await client.get('/auth/me')
    return response.data
  },
}
