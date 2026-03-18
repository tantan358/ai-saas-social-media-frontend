import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
import { fetchCampaignCalendar, type CampaignCalendarResponse, type CalendarPostItem } from '@/services/api';
import { CalendarDays, Instagram, Linkedin, Loader2 } from 'lucide-react';

const weekKeys = ['week1', 'week2', 'week3', 'week4'] as const;
const DAY_NAMES: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

type CampaignCalendarSectionProps = {
  campaignId: string;
  language: Language;
  onReschedule?: (postId: string, item: CalendarPostItem) => void;
  onCancel?: (postId: string) => void;
};

function formatDateLabel(dateStr: string): string {
  if (dateStr === '_unscheduled') return 'Sin programar';
  try {
    const d = new Date(dateStr + 'T12:00:00');
    const day = DAY_NAMES[d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase().slice(0, 3)] || dateStr;
    const month = d.toLocaleDateString('es', { month: 'short' });
    const dayNum = d.getDate();
    return `${day} ${month} ${dayNum}`;
  } catch {
    return dateStr;
  }
}

function formatTime(isoOrNull?: string | null): string {
  if (!isoOrNull) return '—';
  try {
    const d = new Date(isoOrNull);
    return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

export default function CampaignCalendarSection({
  campaignId,
  language,
  onReschedule,
  onCancel,
}: CampaignCalendarSectionProps) {
  const t = useTranslation(language);

  const { data, isLoading } = useQuery({
    queryKey: ['campaign-calendar', campaignId],
    queryFn: () => fetchCampaignCalendar(campaignId),
    enabled: !!campaignId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('loading')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const calendar = data as CampaignCalendarResponse | undefined;
  const byWeek = calendar?.by_week ?? [];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-5 flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CalendarDays className="w-4 h-4" />
            </span>
            <span>{t('calendarView')}</span>
          </h3>
          <p className="text-sm text-muted-foreground">{t('calendarViewDesc')}</p>
          <p className="text-xs text-muted-foreground">{t('noEmptyWeek')}</p>
        </div>

        {byWeek.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center border border-dashed border-border rounded-xl bg-muted/20">
            <CalendarDays className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              {t('noMonthlyPlanning')}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {t('calendarViewDesc')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {byWeek.map((weekBlock) => {
              const weekNum = weekBlock.week;
              const weekLabel = t(weekKeys[weekNum - 1] ?? 'week1');
              return (
                <section
                  key={weekNum}
                  className="rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-foreground">{weekLabel}</h4>
                    <span className="text-xs text-muted-foreground">
                      {weekBlock.by_date.reduce((acc, d) => acc + d.posts.length, 0)} posts
                    </span>
                  </div>
                  <div className="space-y-4">
                    {weekBlock.by_date.map(({ date: dateKey, posts: datePosts }) => (
                        <div key={dateKey} className="rounded-lg bg-muted/30 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-medium text-muted-foreground">
                          {formatDateLabel(dateKey)}
                        </div>
                            <span className="text-[11px] text-muted-foreground">
                              {datePosts.length} {datePosts.length === 1 ? t('post') : t('postsCount')}
                            </span>
                          </div>
                        <ul className="space-y-2">
                          {datePosts.map((item) => (
                            <li
                              key={item.post_id}
                                className="group flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-background/80 hover:bg-primary/5 transition-colors"
                            >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className="text-sm text-muted-foreground w-14">
                                    {formatTime(item.scheduled_at)}
                                  </span>
                                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                                    {item.platform === 'instagram' ? (
                                      <Instagram className="w-4 h-4 text-pink-500" />
                                    ) : (
                                      <Linkedin className="w-4 h-4 text-blue-600" />
                                    )}
                                  </span>
                                  <span className="font-medium text-sm truncate flex-1">
                                    {item.title || 'Sin título'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {item.scheduling_note && (
                                    <Badge variant="outline" className="text-[10px]">
                                      {t('reschedulePost')}
                                    </Badge>
                                  )}
                                  <Badge variant="secondary" className="text-[11px]">
                                    {item.status === 'approved_final'
                                      ? t('postScheduledFinal')
                                      : item.status === 'scheduled'
                                        ? t('postScheduled')
                                        : item.status === 'canceled'
                                          ? t('postCanceled')
                                          : item.status}
                                  </Badge>
                                  {onReschedule &&
                                    (item.status === 'scheduled' || item.status === 'approved_final') && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs px-2"
                                        onClick={() => onReschedule(item.post_id, item)}
                                      >
                                        {t('reschedule')}
                                      </Button>
                                    )}
                                  {onCancel && item.status !== 'canceled' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs px-2 text-destructive"
                                      onClick={() => onCancel(item.post_id)}
                                    >
                                      {t('cancelPost')}
                                    </Button>
                                  )}
                                </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
