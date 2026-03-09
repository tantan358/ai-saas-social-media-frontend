export type Agency = {
  id: string;
  name?: string;
  [key: string]: any;
};

export type Client = {
  id: string;
  name?: string;
  agencyId?: string;
  [key: string]: any;
};

export type Campaign = {
  id: string;
  name: string;
  objective: string;
  language: string;
  clientId: string;
  agencyId: string;
  status: 'active' | 'draft' | 'planned' | 'completed';
  createdAt: string;
  [key: string]: any;
};

export type CreateCampaignPayload = {
  name: string;
  objective: string;
  language: string;
  clientId: string;
  agencyId: string;
};

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Base URL aligned with the original frontend/back-end
const rawApiUrl =
  ((import.meta as any).env?.VITE_API_URL as string | undefined) || undefined;

export const API_URL =
  rawApiUrl && rawApiUrl.length > 0 ? rawApiUrl : 'http://localhost:8000/api';

const getAccessToken = () =>
  localStorage.getItem('access_token') || localStorage.getItem('token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token');
};

const apiFetch = async <T>(
  path: string,
  init?: RequestInit,
  options?: { auth?: boolean }
): Promise<T> => {
  const requireAuth = options?.auth !== false;
  let accessToken = getAccessToken();

  if (requireAuth && !accessToken) {
    throw new ApiError('Not authenticated', 401);
  }

  const doRequest = async (overrideToken?: string) => {
    const url = path.startsWith('http')
      ? path
      : `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    };

    const tokenToUse = overrideToken ?? accessToken;
    if (requireAuth && tokenToUse) {
      (headers as any).Authorization = `Bearer ${tokenToUse}`;
    }

    return fetch(url, {
      ...init,
      headers,
    });
  };

  let res = await doRequest();

  // Handle token refresh on 401 responses
  if (res.status === 401 && requireAuth) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!refreshRes.ok) {
          throw new Error('Failed to refresh token');
        }

        const refreshData = (await refreshRes.json()) as {
          access_token: string;
          refresh_token?: string;
        };

        accessToken = refreshData.access_token;
        localStorage.setItem('access_token', refreshData.access_token);
        if (refreshData.refresh_token) {
          localStorage.setItem('refresh_token', refreshData.refresh_token);
        }
        // Backwards compatibility with code that reads "token"
        localStorage.setItem('token', refreshData.access_token);

        res = await doRequest(refreshData.access_token);
      } catch {
        clearTokens();
        window.location.href = '/login';
        throw new ApiError('Session expired', 401);
      }
    } else {
      clearTokens();
      window.location.href = '/login';
      throw new ApiError('Session expired', 401);
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message =
        (data && (data.message || data.error || data.detail)) || message;
    } catch {
      // ignore JSON parse errors
    }
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as T;
};

export const fetchMyAgency = async (): Promise<Agency> => {
  return apiFetch<Agency>('/agencies/me');
};

export const fetchClients = async (): Promise<Client[]> => {
  return apiFetch<Client[]>('/clients');
};

export const fetchCampaigns = async (clientId: string): Promise<Campaign[]> => {
  return apiFetch<Campaign[]>(`/campaigns?client_id=${encodeURIComponent(clientId)}`);
};

export const createCampaign = async (payload: CreateCampaignPayload): Promise<Campaign> => {
  return apiFetch<Campaign>('/campaigns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export type PostStatus = 'generated' | 'draft' | 'approved' | 'published' | 'edited';

export type Post = {
  id: string;
  title: string;
  content: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  scheduledDate: string;
  week: 1 | 2 | 3 | 4;
  status: PostStatus;
  hashtags?: string;
  link?: string;
};

export type MonthlyPlan = {
  id: string;
  campaignId: string;
  month: string;
  posts: Post[];
  approved: boolean;
};

export const generatePlan = async (campaignId: string): Promise<MonthlyPlan> => {
  return apiFetch<MonthlyPlan>(`/campaigns/${encodeURIComponent(campaignId)}/generate-plan`, {
    method: 'POST',
  });
};

export const fetchPlan = async (campaignId: string): Promise<MonthlyPlan> => {
  return apiFetch<MonthlyPlan>(`/campaigns/${encodeURIComponent(campaignId)}/plan`);
};

export type UpdatePostPayload = {
  title?: string;
  content?: string;
  hashtags?: string;
  link?: string;
};

export const updatePost = async (postId: string, payload: UpdatePostPayload): Promise<Post> => {
  return apiFetch<Post>(`/posts/${encodeURIComponent(postId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const approvePlan = async (campaignId: string): Promise<{ campaign: Campaign; posts: Post[] }> => {
  return apiFetch<{ campaign: Campaign; posts: Post[] }>(
    `/campaigns/${encodeURIComponent(campaignId)}/approve-plan`,
    { method: 'POST' }
  );
};
