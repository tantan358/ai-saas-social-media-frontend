import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/contexts/AppContext';
import { useTranslation, type TranslationKey } from '@/lib/i18n';
import {
  fetchCampaigns,
  fetchPlan,
  generatePlan,
  approvePlan,
  resetPlan,
  scheduleAuto,
  fetchCampaignCalendar,
  type Post,
  type GeneratePlanConfig,
  type ScheduleAutoResponse,
} from '@/services/api';
import {
  ArrowLeft,
  Building2,
  User,
  FolderKanban,
  Target,
  Globe,
  Sparkles,
  CalendarRange,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  AlertCircle,
  RotateCcw,
  CalendarClock,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import PostCard from '@/components/PostCard';
import PostEditModal from '@/components/PostEditModal';
import GeneratePlanConfigModal from '@/components/GeneratePlanConfigModal';
import PublicationWindowsSection from '@/components/PublicationWindowsSection';
import CampaignCalendarSection from '@/components/CampaignCalendarSection';
import { toast } from 'sonner';

const statusKeyMap: Record<string, TranslationKey> = {
  draft: 'draft',
  planning_generated: 'statusPlanningGenerated',
  planning_editing: 'statusPlanningEditing',
  planning_approved: 'statusPlanningApproved',
  approved: 'approved',
  posts_generated: 'statusPostsGenerated',
  posts_approved: 'statusPostsApproved',
  scheduled: 'statusScheduled',
  publishing: 'statusPublishing',
  completed: 'statusCompleted',
  cancelled: 'statusCancelled',
};

const statusClassMap: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  planning_generated: 'bg-accent text-accent-foreground border-accent',
  planning_editing: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  planning_approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  posts_generated: 'bg-primary/10 text-primary border-primary/20',
  posts_approved: 'bg-primary/10 text-primary border-primary/20',
  scheduled: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  publishing: 'bg-success/10 text-success border-success/20',
  completed: 'bg-primary/10 text-primary border-primary/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

const weekKeys: TranslationKey[] = ['week1', 'week2', 'week3', 'week4'];

/** Campaign statuses that block Reset Planning (scheduled/published or later). */
const RESET_PLAN_BLOCKED_STATUSES = ['scheduled', 'publishing', 'completed', 'cancelled'];

function formatCreatedAt(value?: string | null, locale: string = 'en') {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return d.toLocaleString(locale === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language, selectedAgencyId, selectedClientId, agency, clients } = useApp();
  const t = useTranslation(language);

  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [localPosts, setLocalPosts] = useState<Post[] | null>(null);
  const [scheduleResult, setScheduleResult] = useState<ScheduleAutoResponse | null>(null);

  // Fetch calendar (used to render final schedule summary even after refresh)
  const { data: campaignCalendar } = useQuery({
    queryKey: ['campaign-calendar', id],
    queryFn: () => fetchCampaignCalendar(id!),
    enabled: !!id,
  });

  // Fetch campaigns to find the current one
  const { data: campaigns = [], isLoading: isCampaignLoading } = useQuery({
    queryKey: ['campaigns', selectedClientId],
    queryFn: () => fetchCampaigns(selectedClientId!),
    enabled: !!selectedClientId,
  });

  const campaign = campaigns.find((c) => c.id === id);
  const client = clients.find((c) => c.id === (campaign?.clientId || selectedClientId));

  // Fetch existing plan (200 with plan: null when no plan yet — empty state, not error)
  const { data: plan, isLoading: isPlanLoading, error: planError } = useQuery({
    queryKey: ['plan', id],
    queryFn: () => fetchPlan(id!),
    enabled: !!id,
    retry: false,
  });

  // Generate plan mutation (config optional; isRegenerate for toast message)
  const generateMutation = useMutation({
    mutationFn: (vars?: { config?: GeneratePlanConfig | null; isRegenerate?: boolean }) =>
      generatePlan(id!, vars?.config ?? undefined),
    onSuccess: (data, vars) => {
      setShowConfigModal(false);
      setEditingPost(null);
      const rawPlan = data.plan as any;
      const plan = {
        ...data.plan,
        campaignId: rawPlan.campaign_id ?? data.plan.campaignId ?? id,
        generation_config: rawPlan.generation_config ?? data.plan.generation_config ?? null,
        posts: (data.plan.posts || []).map((p: any) => ({
          ...p,
          week: p.week_number ?? p.week ?? 1,
        })),
      };
      queryClient.setQueryData(['plan', id], plan);
      queryClient.invalidateQueries({ queryKey: ['campaigns', selectedClientId] });
      setLocalPosts(null);
      toast.success(vars?.isRegenerate ? t('planningRegenerated') : t('planningGenerated'));
    },
    onError: (err: Error) => {
      setShowConfigModal(false);
      toast.error(err.message || t('errorGeneric'));
    },
  });

  // Reset plan mutation
  const resetMutation = useMutation({
    mutationFn: () => resetPlan(id!),
    onSuccess: () => {
      setShowResetDialog(false);
      setEditingPost(null);
      setLocalPosts(null);
      queryClient.setQueryData(['plan', id], null);
      queryClient.invalidateQueries({ queryKey: ['campaigns', selectedClientId] });
      setIsApproved(false);
      toast.success(t('planningResetSuccess'));
    },
    onError: (err: Error) => {
      setShowResetDialog(false);
      toast.error(err.message || t('errorGeneric'));
    },
  });

  // Schedule-auto mutation
  const scheduleAutoMutation = useMutation({
    mutationFn: (planStartDate?: string | null) => scheduleAuto(id!, planStartDate),
    onSuccess: (data) => {
      setScheduleResult(data);
      queryClient.invalidateQueries({ queryKey: ['plan', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', selectedClientId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-calendar', id] });
      toast.success(t('scheduleAutoSuccess'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('errorGeneric'));
    },
  });

  // Approve plan mutation
  const approveMutation = useMutation({
    mutationFn: () => approvePlan(id!),
    onSuccess: (data) => {
      // Update posts to approved status from backend response
      setLocalPosts(data.posts);
      setIsApproved(true);
      setShowApproveDialog(false);
      // Invalidate campaigns to reflect updated campaign status
      queryClient.invalidateQueries({ queryKey: ['campaigns', selectedClientId] });
      queryClient.invalidateQueries({ queryKey: ['plan', id] });
      toast.success(t('planningApprovedSuccess'));
    },
    onError: (err: Error) => {
      setShowApproveDialog(false);
      toast.error(err.message || t('errorGeneric'));
    },
  });

  // Resolved posts: local edits override fetched plan
  const posts = localPosts ?? plan?.posts ?? [];
  // GET /plan returns 200 with { plan: null } when no plan yet → empty state, not error
  const hasPlan = !!plan && !planError;
  // Approved: from server status or local state after approving
  const isPlanApproved = campaign?.status === 'planning_approved' || isApproved;
  // Reset Planning: allowed when there is a plan and campaign is not scheduled/published
  const canResetPlan =
    hasPlan &&
    campaign &&
    !RESET_PLAN_BLOCKED_STATUSES.includes(campaign.status);
  // Schedule Automatically: only when campaign is in planning_approved status
  const canScheduleAuto = campaign?.status === 'planning_approved';

  if (isCampaignLoading) {
    return (
      <MainLayout>
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!campaign) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-muted-foreground mb-4">{t('campaignNotFound')}</p>
          <Button variant="outline" onClick={() => navigate('/campaigns')}>
            {t('backToCampaigns')}
          </Button>
        </div>
      </MainLayout>
    );
  }

  const displayStatus = isPlanApproved ? 'approved' : campaign.status;
  const statusLabel = t(statusKeyMap[displayStatus] || 'draft');
  const statusClass = statusClassMap[displayStatus] || statusClassMap.draft;

  const handleGeneratePlanning = () => {
    setShowConfigModal(true);
  };

  const handleSubmitGenerateConfig = (config: GeneratePlanConfig) => {
    setShowConfigModal(false);
    generateMutation.mutate({ config, isRegenerate: hasPlan });
  };

  const handleSavePost = (updatedPost: Post) => {
    const current = localPosts ?? plan?.posts ?? [];
    const previous = current.find((p) => p.id === updatedPost.id);
    const merged: Post = {
      ...updatedPost,
      hashtags: updatedPost.hashtags ?? previous?.hashtags,
      link: updatedPost.link ?? previous?.link,
    };
    setLocalPosts(current.map((p) => (p.id === merged.id ? merged : p)));
    toast.success(t('postUpdated'));
  };

  const handleApprovePlanning = () => {
    approveMutation.mutate();
  };

  const handlePostClick = (post: Post) => {
    if (!isApproved) {
      setEditingPost(post);
    }
  };

  const getPostsByWeek = (week: 1 | 2 | 3 | 4) => posts.filter((p) => p.week === week);

  const distribution = plan?.distribution_json ?? (plan?.total_posts != null ? undefined : null);
  const totalPosts = plan?.total_posts ?? (distribution ? distribution.reduce((a, b) => a + b, 0) : null);

  const calendarWeeks = campaignCalendar?.by_week ?? [];
  const calendarAssignedCount = calendarWeeks.reduce(
    (acc, w) => acc + (w.by_date?.reduce((a, bd) => a + (bd.posts?.length ?? 0), 0) ?? 0),
    0
  );

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => navigate('/campaigns')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
            {agency && (
              <>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {agency.name}
                </span>
                <span className="text-border">/</span>
              </>
            )}
            {client && (
              <>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {client.name}
                </span>
                <span className="text-border">/</span>
              </>
            )}
            <span className="flex items-center gap-1 text-foreground font-medium">
              <FolderKanban className="w-3.5 h-3.5" />
              {campaign.name}
            </span>
          </nav>
        </div>

        {/* Campaign Info Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">{campaign.name}</h1>
                  <Badge className={`border text-xs font-medium ${statusClass}`}>
                    {statusLabel}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  {agency && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="w-4 h-4 shrink-0" />
                      <div>
                        <span className="block text-xs text-muted-foreground/70">{t('agency')}</span>
                        <span className="text-foreground font-medium">{agency.name}</span>
                      </div>
                    </div>
                  )}
                  {client && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4 shrink-0" />
                      <div>
                        <span className="block text-xs text-muted-foreground/70">{t('client')}</span>
                        <span className="text-foreground font-medium">{client.name}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="block text-xs text-muted-foreground/70">{t('language')}</span>
                      <span className="text-foreground font-medium">{campaign.language}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarRange className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="block text-xs text-muted-foreground/70">
                        {t('created')}
                      </span>
                      <span className="text-foreground font-medium">
                        {formatCreatedAt(campaign.createdAt, language)}
                      </span>
                    </div>
                  </div>
                </div>
                {hasPlan && (distribution?.length || totalPosts != null) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">{t('distributionSummary')}</p>
                    {distribution && distribution.length >= 4 ? (
                      <>
                        <div className="flex flex-wrap gap-3">
                          {distribution.map((count, idx) => (
                            <span key={idx} className="text-sm text-foreground">
                              {t('weekPosts').replace('{n}', String(idx + 1)).replace('{count}', String(count))}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{t('noEmptyWeek')}</p>
                      </>
                    ) : (
                      <p className="text-sm text-foreground">
                        {totalPosts != null ? `${totalPosts} ${t('postsCount')}` : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {!isPlanApproved && (
                  <Button
                    className="gap-2"
                    onClick={handleGeneratePlanning}
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {hasPlan ? t('regenerateMonthlyPlanning') : t('generateMonthlyPlanning')}
                  </Button>
                )}
                {canResetPlan && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setShowResetDialog(true)}
                    disabled={resetMutation.isPending}
                  >
                    {resetMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    {t('resetPlanning')}
                  </Button>
                )}
                {canScheduleAuto && (
                  <Button
                    className="gap-2"
                    variant="default"
                    onClick={() => scheduleAutoMutation.mutate(undefined)}
                    disabled={scheduleAutoMutation.isPending}
                  >
                    {scheduleAutoMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CalendarClock className="w-4 h-4" />
                    )}
                    {t('scheduleAuto')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {(scheduleResult?.assigned_count ?? 0) > 0 || calendarAssignedCount > 0 ? (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">{t('scheduleAutoSuccess')}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t('timeFromWindows')}</p>
              <div className="space-y-4">
                {(scheduleResult?.by_week ?? calendarWeeks).map((w) => (
                  <div key={w.week} className="rounded-lg border p-4">
                    <h4 className="text-sm font-medium mb-2">{t(weekKeys[w.week - 1])}</h4>
                    <div className="space-y-2">
                      {w.by_date.map((bd) => (
                        <div key={bd.date}>
                          <span className="text-xs text-muted-foreground">{bd.date}</span>
                          <ul className="mt-1 space-y-1">
                            {bd.posts.map((p) => (
                              <li key={p.post_id} className="text-sm">
                                {p.scheduled_at ? p.scheduled_at.slice(11, 16) : '—'} {p.platform} |{' '}
                                {p.title || p.post_id}{' '}
                                {p.status === 'approved_final' ? `(${t('postScheduledFinal')})` : ''}
                                {p.status !== 'approved_final' &&
                                // when backend returns this, null/undefined usually means manual reschedule
                                ('scheduling_window_id' in p ? !(p as any).scheduling_window_id : false)
                                  ? `(${t('manualOverride')})`
                                  : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {isPlanApproved && id && (
          <>
            <div className="mb-6">
              <PublicationWindowsSection campaignId={id} language={language} />
            </div>
            <div className="mb-6">
              <CampaignCalendarSection
                campaignId={id}
                language={language}
                onReschedule={(postId, item) => {
                  const post = posts.find((p) => p.id === postId);
                  if (post) {
                    // Merge calendar item schedule so modal shows correct date/time
                    setEditingPost({
                      ...post,
                      scheduled_at: item.scheduled_at ?? post.scheduled_at,
                      scheduled_date: item.scheduled_date ?? post.scheduled_date,
                      scheduled_time: item.scheduled_at
                        ? item.scheduled_at.slice(11, 16)
                        : post.scheduled_time,
                      scheduling_note: item.scheduling_note ?? post.scheduling_note,
                    });
                  }
                }}
              />
            </div>
          </>
        )}

        {/* Approved Banner */}
        {isPlanApproved && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{t('planningApproved')}</p>
              <p className="text-xs text-muted-foreground">{t('planningApprovedDesc')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('planningApprovedNoRegenerate')}</p>
            </div>
          </div>
        )}

        {/* Monthly Planning */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t('monthlyPlanning')}</h2>
            {hasPlan &&
              posts.length > 0 &&
              !isPlanApproved &&
              campaign &&
              !RESET_PLAN_BLOCKED_STATUSES.includes(campaign.status) && (
                <Button className="gap-2" variant="default" onClick={() => setShowApproveDialog(true)}>
                  <CheckCircle2 className="w-4 h-4" />
                  {t('approveMonthlyPlanning')}
                </Button>
              )}
          </div>

          {/* Loading state for plan */}
          {isPlanLoading && (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((w) => (
                <div key={w}>
                  <Skeleton className="h-5 w-24 mb-3" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Generating state */}
          {generateMutation.isPending && (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl bg-card text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="font-medium text-foreground mb-1">{t('generatingPlanning')}</p>
              <p className="text-sm text-muted-foreground">{t('generatingPlanningDesc')}</p>
            </div>
          )}

          {/* Error state: only for unrecoverable failure (e.g. 500, network); mock fallback still returns 200 */}
          {generateMutation.isError && !hasPlan && (
            <div className="flex flex-col items-center justify-center py-12 border border-destructive/20 rounded-xl bg-destructive/5 text-center">
              <AlertCircle className="w-8 h-8 text-destructive mb-3" />
              <p className="text-sm text-destructive font-medium mb-1">{t('errorGeneric')}</p>
              <p className="text-xs text-muted-foreground mb-4">{(generateMutation.error as Error).message}</p>
              <Button variant="outline" size="sm" onClick={handleGeneratePlanning}>
                {t('retry')}
              </Button>
            </div>
          )}

          {/* No plan yet */}
          {!isPlanLoading && !generateMutation.isPending && !hasPlan && !generateMutation.isError && (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl bg-card text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <CalendarRange className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground mb-1">{t('noMonthlyPlanning')}</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">{t('noMonthlyPlanningDesc')}</p>
              <Button className="gap-2" onClick={handleGeneratePlanning}>
                <Sparkles className="w-4 h-4" />
                {t('generateMonthlyPlanningShort')}
              </Button>
            </div>
          )}

          {/* Plan content: grid adapts for 3–7 posts per week, platform badge on every card */}
          {!isPlanLoading && !generateMutation.isPending && hasPlan && posts.length > 0 && (
            <div className={`space-y-8 ${isPlanApproved ? 'opacity-80 pointer-events-none select-none' : ''}`}>
              {([1, 2, 3, 4] as const).map((week, idx) => {
                const weekPosts = getPostsByWeek(week);
                return (
                  <section key={week} className="rounded-xl border border-border/60 bg-card/50 p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-sm font-semibold text-foreground">{t(weekKeys[idx])}</h3>
                      <span className="text-xs text-muted-foreground">
                        ({weekPosts.length} {weekPosts.length === 1 ? t('post') : t('postsCount')})
                      </span>
                    </div>
                    {weekPosts.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                        <p className="text-sm text-muted-foreground">{t('noPostsThisWeek')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {weekPosts.map((post) => (
                          <PostCard key={post.id} post={post} onClick={handlePostClick} />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <PostEditModal
        post={editingPost}
        postIndex={editingPost ? getPostsByWeek(editingPost.week).findIndex((p) => p.id === editingPost.id) + 1 : 1}
        open={!!editingPost}
        onClose={() => setEditingPost(null)}
        onSave={handleSavePost}
        onScheduleSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['campaign-calendar', id] });
          queryClient.invalidateQueries({ queryKey: ['plan', id] });
        }}
      />

      <GeneratePlanConfigModal
        open={showConfigModal}
        onOpenChange={setShowConfigModal}
        campaignLanguage={campaign?.language ?? 'es'}
        language={language}
        initialConfig={plan?.generation_config ?? null}
        onSubmit={handleSubmitGenerateConfig}
        isSubmitting={generateMutation.isPending}
      />

      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('approveConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('approveConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveMutation.isPending}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprovePlanning} disabled={approveMutation.isPending}>
              {approveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t('approvePlanning')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('resetPlanningConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('resetPlanningConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetMutation.isPending}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t('resetPlanningConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default CampaignDetail;
