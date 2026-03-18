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

export type PostStatus =
  | 'generated'
  | 'draft'
  | 'edited'
  | 'ready_for_final_review'
  | 'approved_final'
  | 'scheduled'
  | 'paused'
  | 'canceled'
  | 'approved'
  | 'published';

export type Post = {
  id: string;
  title: string;
  content: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  scheduledDate: string;
  scheduled_date?: string;
  scheduled_time?: string;
  scheduled_at?: string;
  scheduling_window_id?: string | null;
  /** Optional internal note attached to this post's schedule. */
  scheduling_note?: string | null;
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
  total_posts?: number | null;
  distribution_json?: number[] | null;
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
    total_posts: raw.total_posts ?? plan.total_posts ?? null,
    distribution_json: raw.distribution_json ?? plan.distribution_json ?? null,
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

/** Normalize API post (snake_case) to frontend Post shape so week filter and display work. */
function normalizePost(raw: Record<string, unknown>): Post {
  const week = (raw.week_number ?? raw.week ?? 1) as 1 | 2 | 3 | 4;
  const scheduledAt = raw.scheduled_at ?? raw.scheduledDate;
  const scheduledAtStr =
    scheduledAt != null
      ? typeof scheduledAt === 'string'
        ? scheduledAt
        : (scheduledAt as Date)?.toISOString?.() ?? ''
      : '';
  return {
    id: String(raw.id),
    title: raw.title != null ? String(raw.title) : '',
    content: raw.content != null ? String(raw.content) : '',
    platform: (raw.platform as Post['platform']) ?? 'linkedin',
    scheduledDate: scheduledAtStr,
    scheduled_date: raw.scheduled_date != null ? String(raw.scheduled_date) : undefined,
    scheduled_time: raw.scheduled_time != null ? String(raw.scheduled_time) : undefined,
    scheduled_at: raw.scheduled_at != null ? String(raw.scheduled_at) : undefined,
    scheduling_window_id: raw.scheduling_window_id != null ? String(raw.scheduling_window_id) : undefined,
    scheduling_note:
      raw.scheduling_note != null
        ? typeof raw.scheduling_note === 'string'
          ? raw.scheduling_note
          : String(raw.scheduling_note)
        : undefined,
    week,
    status: (raw.status as Post['status']) ?? 'edited',
    hashtags: raw.hashtags != null ? String(raw.hashtags) : undefined,
    link: raw.link != null ? String(raw.link) : undefined,
  };
}

export const updatePost = async (postId: string, payload: UpdatePostPayload): Promise<Post> => {
  const raw = await apiFetch<Record<string, unknown>>(`/posts/${encodeURIComponent(postId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return normalizePost(raw);
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

// --- Schedule-auto & calendar (Milestone 3) ---
export type ScheduleItem = {
  post_id: string;
  platform?: string | null;
  title?: string | null;
  status: string;
  scheduled_at: string;
  scheduled_date?: string | null;
  day_of_week?: string | null;
};

export type ScheduleByDate = {
  date: string;
  posts: ScheduleItem[];
};

export type ScheduleByWeek = {
  week: number;
  by_date: ScheduleByDate[];
};

export type ScheduleAutoResponse = {
  campaign_id: string;
  assigned_count: number;
  plan_start_date?: string | null;
  by_week: ScheduleByWeek[];
  by_date: ScheduleByDate[];
};

export const scheduleAuto = async (
  campaignId: string,
  planStartDate?: string | null
): Promise<ScheduleAutoResponse> => {
  return apiFetch<ScheduleAutoResponse>(
    `/campaigns/${encodeURIComponent(campaignId)}/schedule-auto`,
    {
      method: 'POST',
      body: JSON.stringify(planStartDate ? { plan_start_date: planStartDate } : {}),
    }
  );
};

export type PublicationWindow = {
  id: string;
  campaign_id: string;
  platform: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  priority: number;
  is_active: boolean;
  created_at?: string | null;
};

export type PublicationWindowCreate = {
  platform: 'linkedin' | 'instagram';
  day_of_week: string;
  start_time: string;
  end_time: string;
  priority?: number;
  is_active?: boolean;
};

export const fetchPublicationWindows = async (
  campaignId: string
): Promise<PublicationWindow[]> => {
  const raw = await apiFetch<unknown[]>(
    `/campaigns/${encodeURIComponent(campaignId)}/publication-windows`
  );
  return (raw || []).map((w: any) => ({
    id: w.id,
    campaign_id: w.campaign_id,
    platform: w.platform ?? 'linkedin',
    day_of_week: w.day_of_week ?? 'monday',
    start_time: typeof w.start_time === 'string' ? w.start_time : '09:00:00',
    end_time: typeof w.end_time === 'string' ? w.end_time : '17:00:00',
    priority: w.priority ?? 1,
    is_active: w.is_active !== false,
    created_at: w.created_at,
  }));
};

export const savePublicationWindows = async (
  campaignId: string,
  windows: PublicationWindowCreate[]
): Promise<PublicationWindow[]> => {
  const raw = await apiFetch<unknown[]>(
    `/campaigns/${encodeURIComponent(campaignId)}/publication-windows`,
    {
      method: 'POST',
      body: JSON.stringify({ windows }),
    }
  );
  return (raw || []).map((w: any) => ({
    id: w.id,
    campaign_id: w.campaign_id,
    platform: w.platform ?? 'linkedin',
    day_of_week: w.day_of_week ?? 'monday',
    start_time: typeof w.start_time === 'string' ? w.start_time : '09:00:00',
    end_time: typeof w.end_time === 'string' ? w.end_time : '17:00:00',
    priority: w.priority ?? 1,
    is_active: w.is_active !== false,
    created_at: w.created_at,
  }));
};

export type CalendarPostItem = {
  post_id: string;
  platform?: string | null;
  title?: string | null;
  status: string;
  week_number: number;
  scheduled_at?: string | null;
  scheduled_date?: string | null;
  /** Optional internal note stored with this scheduled post. */
  scheduling_note?: string | null;
  client_name?: string | null;
  campaign_name?: string | null;
};

export type CalendarByDate = {
  date: string;
  posts: CalendarPostItem[];
};

export type CalendarByWeek = {
  week: number;
  by_date: CalendarByDate[];
};

export type CampaignCalendarResponse = {
  campaign_id: string;
  campaign_name?: string | null;
  client_name?: string | null;
  by_week: CalendarByWeek[];
  by_date: CalendarByDate[];
};

export const fetchCampaignCalendar = async (
  campaignId: string
): Promise<CampaignCalendarResponse> => {
  return apiFetch<CampaignCalendarResponse>(
    `/campaigns/${encodeURIComponent(campaignId)}/calendar`
  );
};

export type PostSchedulePayload = {
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time: string; // HH:mm or HH:mm:ss
  scheduling_note?: string | null;
};

export const schedulePost = async (
  postId: string,
  payload: PostSchedulePayload
): Promise<Post> => {
  const body: Record<string, unknown> = {
    scheduled_date: payload.scheduled_date,
    scheduled_time: payload.scheduled_time,
  };
  // Only send scheduling_note when explicitly provided so we don't erase existing notes unintentionally
  if (Object.prototype.hasOwnProperty.call(payload, 'scheduling_note')) {
    body.scheduling_note = payload.scheduling_note ?? null;
  }

  const raw = await apiFetch<Record<string, unknown>>(
    `/posts/${encodeURIComponent(postId)}/schedule`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    }
  );
  return normalizePost(raw);
};
