import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import { updatePost, schedulePost, type Post } from '@/services/api';
import { Loader2, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

type PostEditModalProps = {
  post: Post | null;
  postIndex?: number;
  open: boolean;
  onClose: () => void;
  onSave: (post: Post) => void;
  onScheduleSuccess?: () => void;
};

function formatScheduled(at?: string | null, date?: string | null, time?: string | null): string {
  if (at) {
    try {
      const d = new Date(at);
      return d.toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return at;
    }
  }
  if (date && time) return `${date} ${time.slice(0, 5)}`;
  return '—';
}

/** Normalize to YYYY-MM-DD for <input type="date">. Returns today if invalid/empty. */
function toDateInputValue(value?: string | null): string {
  if (!value || !value.trim()) {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  }
  try {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch {
    // fallback: if already YYYY-MM-DD-like, use it
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

/** Normalize to HH:MM (24h) for <input type="time">. */
function toTimeInputValue(value?: string | null): string {
  if (!value || !value.trim()) return '09:00';
  const trimmed = value.trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?(\s*[AaPp][Mm])?$/.test(trimmed)) {
    const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = match[2];
      if (/[Pp][Mm]/.test(trimmed) && h < 12) h += 12;
      if (/[Aa][Mm]/.test(trimmed) && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${m}`;
    }
  }
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) return trimmed.slice(0, 5);
  return '09:00';
}

const PostEditModal = ({ post, postIndex = 1, open, onClose, onSave, onScheduleSuccess }: PostEditModalProps) => {
  const { language } = useApp();
  const t = useTranslation(language);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [link, setLink] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const canReschedule =
    post?.status === 'approved_final' || post?.status === 'scheduled';
  // After approve: content locked, schedule editable. Before approve: content editable, schedule locked.
  const contentLocked = post?.status === 'approved_final' || post?.status === 'scheduled';
  const scheduleLocked = !canReschedule;

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setHashtags(post.hashtags || '');
      setLink(post.link || '');
      setRescheduleDate(
        toDateInputValue(
          post.scheduled_date ?? post.scheduled_at ?? null
        )
      );
      setRescheduleTime(
        toTimeInputValue(
          post.scheduled_time ?? post.scheduled_at ?? null
        )
      );
    }
  }, [post]);

  const mutation = useMutation({
    mutationFn: (payload: { title: string; content: string; hashtags?: string; link?: string }) =>
      updatePost(post!.id, payload),
    onSuccess: (updatedPost) => {
      onSave(updatedPost);
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || t('errorGeneric'));
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (payload: { scheduled_date: string; scheduled_time: string }) =>
      schedulePost(post!.id, payload),
    onSuccess: (updatedPost) => {
      onSave(updatedPost);
      onScheduleSuccess?.();
      toast.success(t('rescheduleSuccess'));
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || t('errorGeneric'));
    },
  });

  const handleSave = () => {
    if (!post) return;
    mutation.mutate({
      title,
      content,
      hashtags: hashtags.trim() || undefined,
      link: link.trim() || undefined,
    });
  };

  const handleReschedule = () => {
    if (!post || !rescheduleDate || !rescheduleTime) return;
    const timeStr = rescheduleTime.length === 5 ? `${rescheduleTime}:00` : rescheduleTime;
    scheduleMutation.mutate({
      scheduled_date: rescheduleDate,
      scheduled_time: timeStr,
    });
  };

  if (!post) return null;

  const weekKey = `week${post.week}` as const;
  const statusLabel =
    post.status === 'approved_final'
      ? t('postScheduledFinal')
      : post.status === 'scheduled'
        ? t('postScheduled')
        : post.status === 'canceled'
          ? t('postCanceled')
          : post.status;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !mutation.isPending && !scheduleMutation.isPending) onClose(); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('editPost')}</DialogTitle>
          <DialogDescription className="text-sm">
            {t(weekKey)} / Post {postIndex} · {t('platform')}: {post.platform}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{statusLabel}</Badge>
            {(post.scheduled_at || post.scheduled_date) && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <CalendarClock className="w-3.5 h-3.5" />
                {t('scheduledAt')}: {formatScheduled(post.scheduled_at, post.scheduled_date, post.scheduled_time)}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-title">{t('title')}</Label>
            <Input
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('titlePlaceholder')}
              className="h-10"
              disabled={mutation.isPending || contentLocked}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-content">{t('copyContent')}</Label>
            <Textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder={t('contentPlaceholder')}
              className="resize-none"
              disabled={mutation.isPending || contentLocked}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-hashtags">
              {t('hashtags')} <span className="text-muted-foreground font-normal">({t('optional')})</span>
            </Label>
            <Input
              id="post-hashtags"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder={t('hashtagsPlaceholder')}
              className="h-10"
              disabled={mutation.isPending || contentLocked}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-link">
              {t('link')} <span className="text-muted-foreground font-normal">({t('optional')})</span>
            </Label>
            <Input
              id="post-link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder={t('linkPlaceholder')}
              className="h-10"
              disabled={mutation.isPending || contentLocked}
            />
          </div>

          {(canReschedule || scheduleLocked) && (
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="text-sm font-medium">{t('scheduleSectionTitle')}</h4>
              <p className="text-xs text-muted-foreground">{t('scheduleSectionDesc')}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="post-scheduled-date">{t('scheduledDate')}</Label>
                  <Input
                    id="post-scheduled-date"
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    disabled={scheduleMutation.isPending || scheduleLocked}
                  />
                </div>
                <div>
                  <Label htmlFor="post-scheduled-time">{t('startTime')}</Label>
                  <Input
                    id="post-scheduled-time"
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    disabled={scheduleMutation.isPending || scheduleLocked}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending || scheduleMutation.isPending}>
            {t('cancel')}
          </Button>
          {canReschedule && (
            <Button
              variant="default"
              onClick={handleReschedule}
              disabled={scheduleMutation.isPending || !rescheduleDate || !rescheduleTime}
            >
              {scheduleMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />}
              {t('updateScheduleButton')}
            </Button>
          )}
          {!contentLocked && (
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('save')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PostEditModal;
