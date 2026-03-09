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
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import { updatePost, type Post } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type PostEditModalProps = {
  post: Post | null;
  postIndex?: number;
  open: boolean;
  onClose: () => void;
  onSave: (post: Post) => void;
};

const PostEditModal = ({ post, postIndex = 1, open, onClose, onSave }: PostEditModalProps) => {
  const { language } = useApp();
  const t = useTranslation(language);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setHashtags(post.hashtags || '');
      setLink(post.link || '');
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

  const handleSave = () => {
    if (!post) return;
    mutation.mutate({
      title,
      content,
      hashtags: hashtags.trim() || undefined,
      link: link.trim() || undefined,
    });
  };

  if (!post) return null;

  const weekKey = `week${post.week}` as const;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !mutation.isPending) onClose(); }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('editPost')}</DialogTitle>
          <DialogDescription className="text-sm">
            {t(weekKey)} / Post {postIndex}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="post-title">{t('title')}</Label>
            <Input
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('titlePlaceholder')}
              className="h-10"
              disabled={mutation.isPending}
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
              disabled={mutation.isPending}
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
              disabled={mutation.isPending}
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
              disabled={mutation.isPending}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PostEditModal;
