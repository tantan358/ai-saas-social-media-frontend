import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import type { Post, PostStatus } from '@/services/api';
import { Instagram, Linkedin } from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n';

const platformConfig: Record<string, { label: string; icon: typeof Instagram; className: string }> = {
  instagram: {
    label: 'Instagram',
    icon: Instagram,
    className: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  },
  linkedin: {
    label: 'LinkedIn',
    icon: Linkedin,
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  facebook: {
    label: 'Facebook',
    icon: Linkedin,
    className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  },
  twitter: {
    label: 'Twitter',
    icon: Linkedin,
    className: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  },
};

const statusKeyMap: Partial<Record<PostStatus, TranslationKey>> & Record<string, TranslationKey> = {
  generated: 'postGenerated',
  draft: 'postDraft',
  edited: 'postEdited',
  approved: 'postApproved',
  published: 'postPublished',
  approved_final: 'postScheduledFinal',
  scheduled: 'postScheduled',
  paused: 'postDraft',
  canceled: 'postCanceled',
  ready_for_final_review: 'postEdited',
};

const statusClassMap: Partial<Record<PostStatus, string>> & Record<string, string> = {
  generated: 'bg-success/10 text-success border-success/20',
  draft: 'bg-muted text-muted-foreground border-border',
  edited: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  approved: 'bg-primary/10 text-primary border-primary/20',
  published: 'bg-accent text-accent-foreground border-accent',
  approved_final: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  scheduled: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  paused: 'bg-muted border-border',
  canceled: 'bg-muted text-muted-foreground border-border',
  ready_for_final_review: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

type PostCardProps = {
  post: Post;
  onClick: (post: Post) => void;
};

const PostCard = ({ post, onClick }: PostCardProps) => {
  const { language } = useApp();
  const t = useTranslation(language);

  const platform = platformConfig[post.platform] || platformConfig.instagram;
  const PlatformIcon = platform.icon;
  const statusLabel = t(statusKeyMap[post.status] ?? 'postEdited');
  const statusClass = statusClassMap[post.status] ?? statusClassMap.edited;

  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
      onClick={() => onClick(post)}
    >
      <CardContent className="p-4">
        {/* Title first for better readability */}
        <h4 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors leading-snug mb-2 line-clamp-2">
          {post.title}
        </h4>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {post.content}
        </p>

        {/* Footer row: platform + status below content */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border shrink-0 ${platform.className}`}
            title={platform.label}
          >
            <PlatformIcon className="w-3 h-3" />
            {platform.label}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {post.scheduledDate && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {post.scheduledDate}
              </span>
            )}
            <Badge className={`border text-[10px] font-medium shrink-0 ${statusClass}`}>
              {statusLabel}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
