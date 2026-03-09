import { API_URL } from './api';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  /**
   * Convenience alias so existing code can keep using `response.token`
   * while the backend returns `access_token`.
   */
  token: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    [key: string]: any;
  };
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Invalid email or password');
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      token_type: string;
      token?: string;
      user?: {
        id: string;
        email: string;
        name?: string;
        [key: string]: any;
      };
    };

    const token = data.token ?? data.access_token;

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      token,
      user: data.user,
    };
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your connection or the server status.');
    }
    throw error;
  }
};
