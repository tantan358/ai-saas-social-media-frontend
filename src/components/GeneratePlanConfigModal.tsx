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
import type { Language } from '@/lib/i18n';
import type { GeneratePlanConfig } from '@/services/api';
import { Loader2 } from 'lucide-react';

const POSTS_PER_WEEK_MIN = 3;
const POSTS_PER_WEEK_MAX = 7;
const CHANNEL_OPTIONS: { value: 'linkedin' | 'instagram' | 'both'; channels: ('linkedin' | 'instagram')[] }[] = [
  { value: 'linkedin', channels: ['linkedin'] },
  { value: 'instagram', channels: ['instagram'] },
  { value: 'both', channels: ['linkedin', 'instagram'] },
];
const DISTRIBUTION_OPTIONS: GeneratePlanConfig['distribution_strategy'][] = [
  'balanced',
  'linkedin_priority',
  'instagram_priority',
];
const CONTENT_LENGTH_OPTIONS: GeneratePlanConfig['content_length'][] = ['short', 'medium', 'long'];
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

const defaultConfig: GeneratePlanConfig = {
  posts_per_week: 4,
  channels: ['linkedin', 'instagram'],
  distribution_strategy: 'balanced',
  campaign_goal_mix: ['awareness', 'engagement'],
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

  useEffect(() => {
    if (!open) return;
    setPostsPerWeek(initialConfig?.posts_per_week ?? defaultConfig.posts_per_week!);
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
    const ch = initialConfig?.channels as string[] | undefined;
    if (Array.isArray(ch)) {
      if (ch.length === 1 && ch[0] === 'linkedin') setChannelValue('linkedin');
      else if (ch.length === 1 && ch[0] === 'instagram') setChannelValue('instagram');
      else setChannelValue('both');
    } else {
      setChannelValue('both');
    }
  }, [open, campaignLanguage, initialConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const channels = CHANNEL_OPTIONS.find((o) => o.value === channelValue)!.channels;
    onSubmit({
      posts_per_week: Math.min(POSTS_PER_WEEK_MAX, Math.max(POSTS_PER_WEEK_MIN, postsPerWeek)),
      channels,
      distribution_strategy: distributionStrategy,
      campaign_goal_mix: campaignGoalMix.length ? campaignGoalMix : ['awareness', 'engagement'],
      content_variation: contentVariation,
      language,
      content_length: contentLength,
      call_to_action_required: callToActionRequired,
    });
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
            <Label>{t('generateConfigCampaignGoals')}</Label>
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
                  <span>{t(`generateConfigGoal_${goal}` as any)}</span>
                </label>
              ))}
            </div>
          </div>

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
