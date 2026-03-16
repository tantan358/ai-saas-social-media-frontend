import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import type { Language, TranslationKey } from '@/lib/i18n';
import type { GeneratePlanConfig, ChannelConfig, ContentObjective } from '@/services/api';
import { CONTENT_OBJECTIVES } from '@/services/api';
import { Loader2 } from 'lucide-react';

const POSTS_PER_WEEK_MIN = 1;
const POSTS_PER_WEEK_MAX = 7;
const CHANNEL_OPTIONS: { value: 'linkedin' | 'instagram' | 'both'; channels: ('linkedin' | 'instagram')[] }[] = [
  { value: 'linkedin', channels: ['linkedin'] },
  { value: 'instagram', channels: ['instagram'] },
  { value: 'both', channels: ['linkedin', 'instagram'] },
];
const DISTRIBUTION_OPTIONS: NonNullable<GeneratePlanConfig['distribution_strategy']>[] = [
  'balanced',
  'linkedin_priority',
  'instagram_priority',
];
const CONTENT_LENGTH_OPTIONS: GeneratePlanConfig['content_length'][] = ['short', 'medium', 'long'];
const OBJECTIVE_MODE_OPTIONS: NonNullable<GeneratePlanConfig['objective_mode']>[] = [
  'mixed',
  'by_day',
  'by_post',
];
const CAMPAIGN_GOAL_OPTIONS = [
  'awareness',
  'engagement',
  'leads',
  'sales',
  'brand_loyalty',
  'traffic',
  'conversions',
  'community',
  'thought_leadership',
] as const;
const WEEKDAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const defaultConfig: GeneratePlanConfig = {
  posts_per_week: 4,
  channels: ['linkedin', 'instagram'],
  distribution_strategy: 'balanced',
  campaign_goal_mix: ['awareness', 'engagement'],
  objective_mode: 'mixed',
  content_variation: true,
  language: 'es',
  content_length: 'medium',
  call_to_action_required: false,
};

export type GeneratePlanConfigModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignLanguage: string;
  /** UI language for labels (e.g. from useApp().language) */
  language: Language;
  initialConfig?: Record<string, unknown> | null;
  onSubmit: (config: GeneratePlanConfig) => void;
  isSubmitting?: boolean;
};

export default function GeneratePlanConfigModal({
  open,
  onOpenChange,
  campaignLanguage,
  language: uiLanguage,
  initialConfig,
  onSubmit,
  isSubmitting = false,
}: GeneratePlanConfigModalProps) {
  const t = useTranslation(uiLanguage);
  const [postsPerWeek, setPostsPerWeek] = useState(defaultConfig.posts_per_week!);
  const [channelValue, setChannelValue] = useState<'linkedin' | 'instagram' | 'both'>('both');
  const [distributionStrategy, setDistributionStrategy] = useState<GeneratePlanConfig['distribution_strategy']>(
    defaultConfig.distribution_strategy!
  );
  const [campaignGoalMix, setCampaignGoalMix] = useState<string[]>(defaultConfig.campaign_goal_mix!);
  const [contentVariation, setContentVariation] = useState(defaultConfig.content_variation!);
  const [language, setLanguage] = useState<'es' | 'en'>(
    (campaignLanguage === 'en' || campaignLanguage === 'es' ? campaignLanguage : 'es') as 'es' | 'en'
  );
  const [contentLength, setContentLength] = useState<GeneratePlanConfig['content_length']>(
    defaultConfig.content_length!
  );
  const [callToActionRequired, setCallToActionRequired] = useState(defaultConfig.call_to_action_required!);
  const [objectiveMode, setObjectiveMode] = useState<NonNullable<GeneratePlanConfig['objective_mode']>>(
    defaultConfig.objective_mode ?? 'mixed'
  );
  const [objectiveByDay, setObjectiveByDay] = useState<ContentObjective[]>(
    WEEKDAY_KEYS.map(() => 'education')
  );
  const [objectiveByPost, setObjectiveByPost] = useState<ContentObjective[]>([]);

  const effectivePostsPerWeek = Math.min(POSTS_PER_WEEK_MAX, Math.max(POSTS_PER_WEEK_MIN, postsPerWeek));
  const totalPostsPerWeek =
    channelValue === 'both' ? 2 * effectivePostsPerWeek : effectivePostsPerWeek;
  const totalPosts = 4 * totalPostsPerWeek;
  /** Number of "Objective per day" rows: matches Posts per week (1–7). */
  const objectiveByDaySlotCount = effectivePostsPerWeek;

  useEffect(() => {
    if (!open) return;
    const ppw = initialConfig?.posts_per_week;
    setPostsPerWeek(
      typeof ppw === 'number' && ppw >= POSTS_PER_WEEK_MIN && ppw <= POSTS_PER_WEEK_MAX
        ? ppw
        : defaultConfig.posts_per_week!
    );
    setDistributionStrategy(
      (initialConfig?.distribution_strategy as GeneratePlanConfig['distribution_strategy']) ??
        defaultConfig.distribution_strategy!
    );
    setCampaignGoalMix(
      Array.isArray(initialConfig?.campaign_goal_mix)
        ? initialConfig.campaign_goal_mix
        : defaultConfig.campaign_goal_mix!
    );
    setContentVariation(
      typeof initialConfig?.content_variation === 'boolean'
        ? initialConfig.content_variation
        : defaultConfig.content_variation!
    );
    setLanguage(
      initialConfig?.language === 'en' || initialConfig?.language === 'es'
        ? initialConfig.language
        : (campaignLanguage === 'en' || campaignLanguage === 'es' ? campaignLanguage : 'es') as 'es' | 'en'
    );
    setContentLength(
      (initialConfig?.content_length as GeneratePlanConfig['content_length']) ?? defaultConfig.content_length!
    );
    setCallToActionRequired(
      typeof initialConfig?.call_to_action_required === 'boolean'
        ? initialConfig.call_to_action_required
        : defaultConfig.call_to_action_required!
    );
    const ch = initialConfig?.channels as string[] | { name: string; posts_per_week: number }[] | undefined;
    if (Array.isArray(ch)) {
      if (ch.length === 1 && (ch[0] === 'linkedin' || (typeof ch[0] === 'object' && ch[0].name === 'linkedin'))) setChannelValue('linkedin');
      else if (ch.length === 1 && (ch[0] === 'instagram' || (typeof ch[0] === 'object' && ch[0].name === 'instagram'))) setChannelValue('instagram');
      else setChannelValue('both');
    } else {
      setChannelValue('both');
    }
    const mode = (initialConfig?.objective_mode as GeneratePlanConfig['objective_mode']) ?? 'mixed';
    setObjectiveMode(mode in { mixed: 1, by_day: 1, by_post: 1 } ? mode : 'mixed');
    const byDay = initialConfig?.objective_by_day as Record<string, string> | undefined;
    if (byDay && typeof byDay === 'object') {
      setObjectiveByDay(
        WEEKDAY_KEYS.map((day) => (CONTENT_OBJECTIVES.includes((byDay[day] ?? '') as ContentObjective) ? (byDay[day] as ContentObjective) : 'education'))
      );
    } else {
      setObjectiveByDay(WEEKDAY_KEYS.map(() => 'education'));
    }
    const byPost = initialConfig?.objective_by_post as string[] | undefined;
    const storedPerWeekFromConfig =
      Array.isArray(ch) && ch.length > 0 && typeof ch[0] === 'object' && 'posts_per_week' in ch[0]
        ? (ch as { name: string; posts_per_week: number }[]).reduce((s, c) => s + c.posts_per_week, 0)
        : (initialConfig?.posts_per_channel_per_week as Record<string, number> | undefined)
          ? Object.values(initialConfig.posts_per_channel_per_week as Record<string, number>).reduce((a, b) => a + b, 0)
          : 8;
    const initialTotalPosts = 4 * (typeof storedPerWeekFromConfig === 'number' ? storedPerWeekFromConfig : 8);
    if (Array.isArray(byPost) && byPost.length > 0) {
      const padded = [...byPost] as ContentObjective[];
      while (padded.length < initialTotalPosts) padded.push('education');
      setObjectiveByPost(padded.slice(0, initialTotalPosts));
    } else {
      setObjectiveByPost(Array.from({ length: initialTotalPosts }, () => 'education' as ContentObjective));
    }
  }, [open, campaignLanguage, initialConfig]);

  useEffect(() => {
    if (objectiveMode !== 'by_post') return;
    setObjectiveByPost((prev) => {
      if (prev.length >= totalPosts) return prev;
      const next = [...prev];
      while (next.length < totalPosts) next.push('education');
      return next as ContentObjective[];
    });
  }, [objectiveMode, totalPosts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ppw = Math.min(POSTS_PER_WEEK_MAX, Math.max(POSTS_PER_WEEK_MIN, postsPerWeek));
    const channelList = CHANNEL_OPTIONS.find((o) => o.value === channelValue)!.channels;
    const channels: ChannelConfig[] = channelList.map((name) => ({ name, posts_per_week: ppw }));
    const payload: GeneratePlanConfig = {
      channels,
      distribution_strategy: distributionStrategy,
      campaign_goal_mix: campaignGoalMix.length ? campaignGoalMix : ['awareness', 'engagement'],
      content_variation: contentVariation,
      language,
      content_length: contentLength,
      call_to_action_required: callToActionRequired,
    };
    if (objectiveMode === 'mixed') {
      payload.objective_mode = 'mixed';
    } else if (objectiveMode === 'by_day') {
      payload.objective_mode = 'by_day';
      payload.objective_by_day = WEEKDAY_KEYS.slice(0, objectiveByDaySlotCount).reduce(
        (acc, day, i) => ({ ...acc, [day]: objectiveByDay[i] ?? 'education' }),
        {} as Record<string, string>
      );
    } else {
      payload.objective_mode = 'by_post';
      payload.objective_by_post = objectiveByPost.slice(0, totalPosts);
    }
    onSubmit(payload);
  };

  const toggleGoal = (goal: string) => {
    setCampaignGoalMix((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('generateConfigTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="posts_per_week">{t('generateConfigPostsPerWeek')}</Label>
              <Input
                id="posts_per_week"
                type="number"
                min={POSTS_PER_WEEK_MIN}
                max={POSTS_PER_WEEK_MAX}
                value={postsPerWeek}
                onChange={(e) => setPostsPerWeek(Number(e.target.value) || POSTS_PER_WEEK_MIN)}
              />
              <p className="text-xs text-muted-foreground">
                {t('generateConfigPostsPerWeekHint')}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t('generateConfigContentLength')}</Label>
              <Select
                value={contentLength}
                onValueChange={(v) => setContentLength(v as GeneratePlanConfig['content_length'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_LENGTH_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {t(`generateConfigContentLength_${opt}` as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('generateConfigChannels')}</Label>
            <Select value={channelValue} onValueChange={(v: any) => setChannelValue(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linkedin">{t('generateConfigChannelsLinkedIn')}</SelectItem>
                <SelectItem value="instagram">{t('generateConfigChannelsInstagram')}</SelectItem>
                <SelectItem value="both">{t('generateConfigChannelsBoth')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {channelValue === 'both' && (
            <div className="space-y-2">
              <Label>{t('generateConfigDistribution')}</Label>
              <Select
                value={distributionStrategy}
                onValueChange={(v) => setDistributionStrategy(v as GeneratePlanConfig['distribution_strategy'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISTRIBUTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {t(`generateConfigDistribution_${opt}` as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('generateConfigLanguage')}</Label>
            <Select value={language} onValueChange={(v: 'es' | 'en') => setLanguage(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">{t('generateConfigLanguage_es')}</SelectItem>
                <SelectItem value="en">{t('generateConfigLanguage_en')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('generateConfigObjectiveMode')}</Label>
            <Select
              value={objectiveMode}
              onValueChange={(v) => setObjectiveMode(v as NonNullable<GeneratePlanConfig['objective_mode']>)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OBJECTIVE_MODE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {t(`generateConfigObjectiveMode_${opt}` as TranslationKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {objectiveMode === 'mixed' && (
            <div className="space-y-2">
              <Label>{t('generateConfigCampaignGoals')}</Label>
              <p className="text-xs text-muted-foreground">{t('generateConfigCampaignGoalsHint')}</p>
              <div className="grid grid-cols-2 gap-2 rounded-md border border-input p-3 bg-muted/30">
                {CAMPAIGN_GOAL_OPTIONS.map((goal) => (
                  <label
                    key={goal}
                    className="flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={campaignGoalMix.includes(goal)}
                      onCheckedChange={() => toggleGoal(goal)}
                    />
                    <span>{t(`generateConfigGoal_${goal}` as TranslationKey)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {objectiveMode === 'by_day' && (
            <div className="space-y-2">
              <Label>{t('generateConfigObjectiveByDay')}</Label>
              <p className="text-xs text-muted-foreground">
                {objectiveByDaySlotCount} slots — matches &quot;Posts per week&quot;
              </p>
              <div className="rounded-md border border-input p-3 bg-muted/30 space-y-2">
                {Array.from({ length: objectiveByDaySlotCount }, (_, i) => {
                  const dayKey = WEEKDAY_KEYS[i];
                  return (
                    <div key={dayKey} className="flex items-center gap-3">
                      <span className="w-20 text-sm font-medium shrink-0">
                        {t('generateConfigDay').replace('{{n}}', String(i + 1))}
                      </span>
                      <Select
                        value={objectiveByDay[i] ?? 'education'}
                        onValueChange={(v) =>
                          setObjectiveByDay((prev) => {
                            const next = [...prev];
                            next[i] = v as ContentObjective;
                            return next;
                          })
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTENT_OBJECTIVES.map((obj) => (
                            <SelectItem key={obj} value={obj}>
                              {t(`generateConfigObjective_${obj}` as TranslationKey)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {objectiveMode === 'by_post' && (
            <div className="space-y-2">
              <Label>{t('generateConfigObjectiveByPost')}</Label>
              <p className="text-xs text-muted-foreground">
                {totalPosts} {t('generateConfigSlotsTotal')} — {t('generateConfigPostsPerWeekHint')}
              </p>
              <div className="rounded-md border border-input p-3 bg-muted/30 max-h-64 overflow-y-auto space-y-2">
                {Array.from({ length: totalPosts }, (_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-14 text-sm font-medium shrink-0">
                      {t('generateConfigSlot').replace('{{n}}', String(i + 1))}
                    </span>
                    <Select
                      value={(objectiveByPost[i] ?? 'education') as string}
                      onValueChange={(v) =>
                        setObjectiveByPost((prev) => {
                          const next = [...prev];
                          while (next.length <= i) next.push('education');
                          next[i] = v as ContentObjective;
                          return next as ContentObjective[];
                        })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTENT_OBJECTIVES.map((obj) => (
                          <SelectItem key={obj} value={obj}>
                            {t(`generateConfigObjective_${obj}` as TranslationKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-md border border-input p-3">
            <div>
              <Label className="text-base">{t('generateConfigContentVariation')}</Label>
              <p className="text-xs text-muted-foreground">{t('generateConfigContentVariationHint')}</p>
            </div>
            <Switch checked={contentVariation} onCheckedChange={setContentVariation} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-input p-3">
            <div>
              <Label className="text-base">{t('generateConfigCTA')}</Label>
              <p className="text-xs text-muted-foreground">{t('generateConfigCTAHint')}</p>
            </div>
            <Switch checked={callToActionRequired} onCheckedChange={setCallToActionRequired} />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t('generateConfigSubmit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
