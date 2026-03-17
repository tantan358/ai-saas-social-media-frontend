import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            {t('calendarView')}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{t('calendarViewDesc')}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('noEmptyWeek')}</p>
        </div>

        {byWeek.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No hay posts en el plan o calendario.</p>
        ) : (
          <div className="space-y-6">
            {byWeek.map((weekBlock) => {
              const weekNum = weekBlock.week;
              const weekLabel = t(weekKeys[weekNum - 1] ?? 'week1');
              return (
                <section key={weekNum} className="rounded-xl border border-border/60 bg-card/50 p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">{weekLabel}</h4>
                  <div className="space-y-4">
                    {weekBlock.by_date.map(({ date: dateKey, posts: datePosts }) => (
                      <div key={dateKey}>
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                          {formatDateLabel(dateKey)}
                        </div>
                        <ul className="space-y-2">
                          {datePosts.map((item) => (
                            <li
                              key={item.post_id}
                              className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-background hover:bg-muted/30"
                            >
                              <span className="text-sm text-muted-foreground">
                                {formatTime(item.scheduled_at)}
                              </span>
                              {item.platform === 'instagram' ? (
                                <Instagram className="w-4 h-4 text-pink-500" />
                              ) : (
                                <Linkedin className="w-4 h-4 text-blue-600" />
                              )}
                              <span className="font-medium text-sm truncate flex-1 min-w-0">
                                {item.title || 'Sin título'}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {item.status === 'scheduled' ? t('postScheduled') : item.status}
                              </Badge>
                              <div className="flex items-center gap-1">
                                {onReschedule && (item.status === 'scheduled' || item.status === 'approved_final') && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onReschedule(item.post_id, item)}
                                  >
                                    {t('reschedule')}
                                  </Button>
                                )}
                                {onCancel && item.status !== 'canceled' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive"
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
