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

/** Campaign status values from backend (CampaignStatus enum). */
export type CampaignStatus =
  | 'draft'
  | 'planning_generated'
  | 'planning_editing'
  | 'planning_approved'
  | 'posts_generated'
  | 'posts_approved'
  | 'scheduled'
  | 'publishing'
  | 'completed'
  | 'cancelled';

export type Campaign = {
  id: string;
  name: string;
  objective: string;
  language: string;
  clientId: string;
  agencyId: string;
  status: CampaignStatus;
  createdAt: string;
  [key: string]: any;
};

/** Payload for POST /campaigns. Field names must match backend CampaignCreate schema. */
export type CreateCampaignPayload = {
  name: string;
  client_id: string;
  description?: string;
  language?: string; // backend expects "es" | "en" (lowercase)
};

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Turn FastAPI 422 detail array into a readable string for toasts. */
function formatValidationMessage(detail: unknown): string {
  if (!Array.isArray(detail)) return String(detail);
  return detail
    .map((item) => {
      if (item && typeof item === 'object' && 'msg' in item) {
        const loc = (item as { loc?: string[] }).loc;
        const field = loc?.filter(Boolean).join('. ');
        return field ? `${field}: ${(item as { msg: string }).msg}` : (item as { msg: string }).msg;
      }
      return String(item);
    })
    .filter(Boolean)
    .join('. ') || 'Validation failed';
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
      const data = (await res.json()) as { message?: string; error?: string; detail?: unknown };
      if (data) {
        if (data.message) message = data.message;
        else if (data.error) message = data.error;
        else if (res.status === 422 && data.detail != null) message = formatValidationMessage(data.detail);
        else if (data.detail != null) message = Array.isArray(data.detail) ? formatValidationMessage(data.detail) : String(data.detail);
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
};

export const fetchMyAgency = async (): Promise<Agency> => {
  return apiFetch<Agency>('/agencies/me');
};

export const fetchClients = async (): Promise<Client[]> => {
  return apiFetch<Client[]>('/clients');
};

export type CreateClientPayload = {
  name: string;
  agency_id: string;
};

export const createClient = async (payload: CreateClientPayload): Promise<Client> => {
  return apiFetch<Client>('/clients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export type UpdateClientPayload = {
  name: string;
};

export const updateClient = async (clientId: string, payload: UpdateClientPayload): Promise<Client> => {
  return apiFetch<Client>(`/clients/${encodeURIComponent(clientId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

/** Archive (soft delete) a client. Fails with 409 if the client has campaigns. */
export const archiveClient = async (clientId: string): Promise<Client> => {
  return apiFetch<Client>(`/clients/${encodeURIComponent(clientId)}`, {
    method: 'DELETE',
  });
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

/** Payload for PUT /campaigns/:id. All fields optional. */
export type UpdateCampaignPayload = {
  name?: string;
  description?: string;
  language?: 'es' | 'en';
};

export const updateCampaign = async (campaignId: string, payload: UpdateCampaignPayload): Promise<Campaign> => {
  return apiFetch<Campaign>(`/campaigns/${encodeURIComponent(campaignId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deleteCampaign = async (campaignId: string): Promise<void> => {
  return apiFetch<void>(`/campaigns/${encodeURIComponent(campaignId)}`, {
    method: 'DELETE',
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

/** Stored generation config returned with the plan (audit/debugging, prefill on regenerate). */
export type GenerationConfigStored = Record<string, unknown>;

export type MonthlyPlan = {
  id: string;
  campaignId: string;
  campaign_id?: string;
  month?: string;
  posts: Post[];
  approved: boolean;
  /** Config used to generate this plan; set when plan is created/regenerated. */
  generation_config?: GenerationConfigStored | null;
};

/** Per-channel config for generate-plan (backend accepts this or legacy channels string[]). */
export type ChannelConfig = {
  name: 'linkedin' | 'instagram';
  posts_per_week: number;
};

/** Optional body for POST generate-plan. All fields optional; backend applies defaults. */
export type GeneratePlanConfig = {
  /** Legacy: single posts_per_week; prefer channels with posts_per_week per channel */
  posts_per_week?: number;
  /** List of channel names (legacy) or per-channel config */
  channels?: ('linkedin' | 'instagram')[] | ChannelConfig[];
  distribution_strategy?: 'balanced' | 'linkedin_priority' | 'instagram_priority';
  campaign_goal_mix?: string[];
  /** mixed = use campaign_goal_mix; by_day = use objective_by_day; by_post = use objective_by_post */
  objective_mode?: 'mixed' | 'by_day' | 'by_post';
  /** Day name -> objective (keys: monday..sunday). Required when objective_mode=by_day */
  objective_by_day?: Record<string, string>;
  /** Objectives in slot order; cycles if shorter than total posts. Required when objective_mode=by_post */
  objective_by_post?: string[];
  content_variation?: boolean;
  language?: 'es' | 'en';
  content_length?: 'short' | 'medium' | 'long';
  call_to_action_required?: boolean;
};

/** Allowed content objectives for by_day / by_post */
export const CONTENT_OBJECTIVES = [
  'lead_generation',
  'education',
  'product_promotion',
  'brand_authority',
  'conversion',
  'positioning',
] as const;
export type ContentObjective = (typeof CONTENT_OBJECTIVES)[number];

/** Response from POST generate-plan: campaign + plan with posts */
export type GeneratePlanResponse = {
  campaign: Campaign;
  plan: MonthlyPlan;
  /** Debug: "openai" | "mock" — backend used AI or fallback; frontend can ignore */
  generation_mode?: 'openai' | 'mock';
};

/** Timeout for generate-plan request (ms). Must be at least as long as proxy/gateway timeout to avoid 504. */
const GENERATE_PLAN_TIMEOUT_MS = 180_000;

export const generatePlan = async (
  campaignId: string,
  config?: GeneratePlanConfig | null
): Promise<GeneratePlanResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GENERATE_PLAN_TIMEOUT_MS);
  try {
    return await apiFetch<GeneratePlanResponse>(
      `/campaigns/${encodeURIComponent(campaignId)}/generate-plan`,
      {
        method: 'POST',
        signal: controller.signal,
        ...(config ? { body: JSON.stringify(config) } : {}),
      }
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

/** GET plan response: plan is null when no monthly plan exists yet */
export type GetPlanResponse = {
  plan: MonthlyPlan | null;
};

function normalizePlan(plan: MonthlyPlan | null, campaignId: string): MonthlyPlan | null {
  if (!plan) return null;
  const raw = plan as any;
  return {
    ...plan,
    campaignId: raw.campaign_id ?? plan.campaignId ?? campaignId,
    generation_config: raw.generation_config ?? plan.generation_config ?? null,
    posts: (plan.posts || []).map((p: any) => ({
      ...p,
      week: (p.week_number ?? p.week ?? 1) as 1 | 2 | 3 | 4,
    })),
  };
}

export const fetchPlan = async (campaignId: string): Promise<MonthlyPlan | null> => {
  try {
    const res = await apiFetch<GetPlanResponse>(`/campaigns/${encodeURIComponent(campaignId)}/plan`);
    return normalizePlan(res.plan ?? null, campaignId);
  } catch (e: unknown) {
    // 404 = no plan yet (e.g. legacy backend or wrong route); treat as empty state so page is not broken
    const status = (e as { status?: number })?.status;
    if (status === 404) return null;
    throw e;
  }
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

/** Remove current planning and posts; campaign returns to draft. Not allowed when scheduled/published. */
export const resetPlan = async (campaignId: string): Promise<Campaign> => {
  return apiFetch<Campaign>(`/campaigns/${encodeURIComponent(campaignId)}/reset-plan`, {
    method: 'POST',
  });
};
