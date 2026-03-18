import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
import {
  fetchPublicationWindows,
  savePublicationWindows,
  type PublicationWindow,
  type PublicationWindowCreate,
} from '@/services/api';
import { CalendarClock, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const PLATFORMS = ['linkedin', 'instagram'] as const;

type WindowForm = PublicationWindowCreate & { id?: string };

type PublicationWindowsSectionProps = {
  campaignId: string;
  language: Language;
  /** When true, windows are locked after automatic scheduling. */
  locked?: boolean;
};

export default function PublicationWindowsSection({
  campaignId,
  language,
  locked = false,
}: PublicationWindowsSectionProps) {
  const t = useTranslation(language);
  const queryClient = useQueryClient();
  const [editingWindow, setEditingWindow] = useState<WindowForm | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: windows = [], isLoading } = useQuery({
    queryKey: ['publication-windows', campaignId],
    queryFn: () => fetchPublicationWindows(campaignId),
    enabled: !!campaignId,
  });

  const saveMutation = useMutation({
    mutationFn: (wins: PublicationWindowCreate[]) => savePublicationWindows(campaignId, wins),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publication-windows', campaignId] });
      setEditingWindow(null);
      setIsAddOpen(false);
      toast.success(t('windowsSaved'));
    },
    onError: (err: Error) => toast.error(err.message || t('errorGeneric')),
  });

  const handleSaveAll = (newWindows: (PublicationWindow | WindowForm)[]) => {
    const payload: PublicationWindowCreate[] = newWindows.map((w) => ({
      platform: w.platform as 'linkedin' | 'instagram',
      day_of_week: w.day_of_week,
      start_time: w.start_time?.slice(0, 8) || '09:00:00',
      end_time: w.end_time?.slice(0, 8) || '17:00:00',
      priority: w.priority ?? 1,
      is_active: w.is_active !== false,
    }));
    saveMutation.mutate(payload);
  };

  const handleAdd = (form: WindowForm) => {
    handleSaveAll([...windows, form]);
  };

  const handleEdit = (form: WindowForm) => {
    const rest = windows.filter((w) => w.id !== form.id);
    handleSaveAll([...rest, form]);
  };

  const handleDeactivate = (id: string) => {
    const updated = windows.map((w) => (w.id === id ? { ...w, is_active: false } : w));
    handleSaveAll(updated);
  };

  const handleActivate = (id: string) => {
    const updated = windows.map((w) => (w.id === id ? { ...w, is_active: true } : w));
    handleSaveAll(updated);
  };

  const formatDay = (d: string) => d.charAt(0).toUpperCase() + d.slice(1);
  const formatTime = (t: string) => (t && t.length >= 5 ? t.slice(0, 5) : t);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
              <CalendarClock className="w-5 h-5" />
              {t('publicationWindows')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{t('publicationWindowsDesc')}</p>
            {locked && (
              <p className="text-xs font-medium text-amber-600 flex items-center gap-1">
                {/* Reuse manual override copy to avoid new keys */}
                {t('manualOverride')}
              </p>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => setIsAddOpen(true)}
            disabled={saveMutation.isPending || locked}
          >
            <Plus className="w-4 h-4" />
            {t('addWindow')}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('loading')}
          </div>
        ) : windows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No ventanas definidas. El sistema usará horarios por defecto por plataforma. Añade ventanas para personalizar.
          </p>
        ) : (
          <div className="space-y-2">
            {windows.map((w) => (
              <div
                key={w.id}
                className={`flex flex-wrap items-center gap-3 p-3 rounded-lg border text-sm transition-colors ${
                  !w.is_active ? 'opacity-60 bg-muted/30' : 'bg-card hover:bg-muted/40'
                }`}
              >
                <span className="font-medium capitalize">{w.platform}</span>
                <span className="text-muted-foreground">{formatDay(w.day_of_week)}</span>
                <span>{formatTime(w.start_time)} – {formatTime(w.end_time)}</span>
                <span className="text-muted-foreground">P{w.priority}</span>
                <span className={w.is_active ? 'text-green-600' : 'text-muted-foreground'}>
                  {w.is_active ? t('active') : 'Inactiva'}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingWindow({ ...w })}
                    disabled={saveMutation.isPending || locked}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {w.is_active ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeactivate(w.id)}
                      disabled={saveMutation.isPending || locked}
                    >
                      {t('deactivateWindow')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleActivate(w.id)}
                      disabled={saveMutation.isPending || locked}
                    >
                      {t('activateWindow')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <WindowFormDialog
        open={isAddOpen || !!editingWindow}
        onClose={() => {
          setIsAddOpen(false);
          setEditingWindow(null);
        }}
        initial={editingWindow || (isAddOpen ? {} : null)}
        onSave={(form) => {
          if (editingWindow?.id) handleEdit({ ...form, id: editingWindow.id });
          else handleAdd(form);
        }}
        t={t}
        isSubmitting={saveMutation.isPending || locked}
      />
    </Card>
  );
}

type WindowFormDialogProps = {
  open: boolean;
  onClose: () => void;
  initial: WindowForm | null;
  onSave: (form: PublicationWindowCreate) => void;
  t: (key: string) => string;
  isSubmitting: boolean;
};

function WindowFormDialog({
  open,
  onClose,
  initial,
  onSave,
  t,
  isSubmitting,
}: WindowFormDialogProps) {
  const [platform, setPlatform] = useState<'linkedin' | 'instagram'>('linkedin');
  const [dayOfWeek, setDayOfWeek] = useState(DAYS[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [priority, setPriority] = useState(1);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (initial && open) {
      setPlatform((initial.platform as 'linkedin' | 'instagram') || 'linkedin');
      setDayOfWeek((initial.day_of_week as typeof DAYS[number]) || DAYS[0]);
      setStartTime(initial.start_time?.slice(0, 5) || '09:00');
      setEndTime(initial.end_time?.slice(0, 5) || '17:00');
      setPriority(initial.priority ?? 1);
      setIsActive(initial.is_active !== false);
    } else if (!initial && open) {
      setPlatform('linkedin');
      setDayOfWeek(DAYS[0]);
      setStartTime('09:00');
      setEndTime('17:00');
      setPriority(1);
      setIsActive(true);
    }
  }, [initial, open]);

  const handleSubmit = () => {
    onSave({
      platform,
      day_of_week: dayOfWeek,
      start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
      end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
      priority,
      is_active: isActive,
    });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial?.id ? t('editWindow') : t('addWindow')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('platform')}</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as 'linkedin' | 'instagram')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('dayOfWeek')}</Label>
              <Select value={dayOfWeek} onValueChange={(v) => setDayOfWeek(v as typeof DAYS[number])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('startTime')}</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label>{t('endTime')}</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>{t('active')}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
