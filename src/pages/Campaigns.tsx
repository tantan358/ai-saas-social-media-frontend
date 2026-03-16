import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { useTranslation, type TranslationKey } from '@/lib/i18n';
import { fetchCampaigns, createCampaign, updateCampaign, deleteCampaign, type Campaign } from '@/services/api';
import {
  Plus,
  FolderOpen,
  Pencil,
  Trash2,
  Building2,
  User,
  MoreHorizontal,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

/** Backend expects language pattern ^(es|en)$. Dropdown shows friendly labels but option value = backend code. */
const CAMPAIGN_LANGUAGE_OPTIONS: { value: 'es' | 'en'; label: string }[] = [
  { value: 'es', label: 'Español (ES)' },
  { value: 'en', label: 'English (EN)' },
];

function campaignLanguageForPayload(uiValue: string): 'es' | 'en' {
  const found = CAMPAIGN_LANGUAGE_OPTIONS.find((o) => o.value === uiValue || o.value.toUpperCase() === uiValue);
  return found ? found.value : 'es';
}

const statusKeyMap: Record<Campaign['status'], TranslationKey> = {
  draft: 'draft',
  planning_generated: 'statusPlanningGenerated',
  planning_editing: 'statusPlanningEditing',
  planning_approved: 'statusPlanningApproved',
  posts_generated: 'statusPostsGenerated',
  posts_approved: 'statusPostsApproved',
  scheduled: 'statusScheduled',
  publishing: 'statusPublishing',
  completed: 'statusCompleted',
  cancelled: 'statusCancelled',
};

const statusClassMap: Record<Campaign['status'], string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  planning_generated: 'bg-accent text-accent-foreground border-accent',
  planning_editing: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  planning_approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  posts_generated: 'bg-primary/10 text-primary border-primary/20',
  posts_approved: 'bg-primary/10 text-primary border-primary/20',
  scheduled: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  publishing: 'bg-success/10 text-success border-success/20',
  completed: 'bg-primary/10 text-primary border-primary/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

const Campaigns = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Same shared state as header client selector (AppContext.selectedClientId)
  const {
    language,
    selectedAgencyId,
    selectedClientId,
    agency,
    clients,
    isAgencyLoading,
    isClientsLoading,
    agencyError,
    clientsError,
  } = useApp();

  const t = useTranslation(language);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Campaign | null>(null);

  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignObjective, setNewCampaignObjective] = useState('');
  const [newCampaignLanguage, setNewCampaignLanguage] = useState<'es' | 'en'>('es');

  const [editCampaignName, setEditCampaignName] = useState('');
  const [editCampaignObjective, setEditCampaignObjective] = useState('');
  const [editCampaignLanguage, setEditCampaignLanguage] = useState<'es' | 'en'>('es');

  const activeAgencyId = selectedAgencyId ?? agency?.id ?? null;
  /** Selected client id from global app state (used for payload.client_id; never use client name in payload). */
  const activeClientId = selectedClientId ?? null;
  /** Display only: name shown in modal for context. Not sent to API. */
  const activeClient = clients.find((c) => c.id === activeClientId) ?? null;

  // Fetch campaigns
  const {
    data: campaigns = [],
    isLoading: isCampaignsLoading,
    error: campaignsError,
  } = useQuery({
    queryKey: ['campaigns', activeClientId],
    queryFn: () => fetchCampaigns(activeClientId!),
    enabled: !!activeClientId,
    staleTime: 30 * 1000,
  });

  // Create campaign mutation
  const createMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', activeClientId] });
      setIsNewCampaignOpen(false);
      setNewCampaignName('');
      setNewCampaignObjective('');
      setNewCampaignLanguage('es');
      toast.success(t('campaignCreated'));
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create campaign');
    },
  });

  // Update campaign mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; description?: string; language?: 'es' | 'en' } }) =>
      updateCampaign(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', activeClientId] });
      setEditTarget(null);
      toast.success(language === 'en' ? 'Campaign updated' : 'Campaña actualizada');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update campaign');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', activeClientId] });
      setDeleteTargetId(null);
      toast.success(language === 'en' ? 'Campaign deleted' : 'Campaña eliminada');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete campaign');
    },
  });

  const handleDelete = (id: string) => {
    setDeleteTargetId(null);
    deleteMutation.mutate(id);
  };

  const handleCreateCampaign = () => {
    if (!activeAgencyId) {
      toast.error('Agency not loaded');
      return;
    }

    if (!activeClientId) {
      toast.error(t('selectClient'));
      return;
    }

    if (!newCampaignName.trim() || !newCampaignObjective.trim()) {
      toast.error(t('fillAllFields'));
      return;
    }

    // Payload uses real client id from global state only (never client name). Language: backend code only (es|en).
    const payload = {
      name: newCampaignName.trim(),
      client_id: activeClientId,
      description: newCampaignObjective.trim() || undefined,
      language: campaignLanguageForPayload(newCampaignLanguage),
    };
    // TEMPORARY DEBUG — remove when done
    console.debug('[Campaign create] payload:', payload);
    console.debug('[Campaign create] selected client_id:', activeClientId, 'selected client:', activeClient);
    console.debug('[Campaign create] language normalized:', payload.language);
    // END TEMPORARY DEBUG
    createMutation.mutate(payload);
  };

  const handleOpenNewCampaignModal = () => {
    if (!activeClientId) {
      toast.warning(t('selectClientFirst'));
      return;
    }
    setNewCampaignName('');
    setNewCampaignObjective('');
    setNewCampaignLanguage('es');
    setIsNewCampaignOpen(true);
  };

  const handleOpenEditModal = (campaign: Campaign) => {
    const desc = (campaign as any).description ?? campaign.objective ?? '';
    setEditTarget(campaign);
    setEditCampaignName(campaign.name);
    setEditCampaignObjective(desc);
    setEditCampaignLanguage((campaign.language?.toLowerCase() === 'en' ? 'en' : 'es') as 'es' | 'en');
  };

  const handleSaveEdit = () => {
    if (!editTarget) return;
    if (!editCampaignName.trim()) {
      toast.error(t('fillAllFields'));
      return;
    }
    updateMutation.mutate({
      id: editTarget.id,
      payload: {
        name: editCampaignName.trim(),
        description: editCampaignObjective.trim() || undefined,
        language: editCampaignLanguage,
      },
    });
  };

  const deleteTarget = campaigns.find((c) => c.id === deleteTargetId);

  const isLoadingContext = isAgencyLoading || isClientsLoading;
  const hasContextError = agencyError || clientsError;

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('campaigns')}</h1>

            {isLoadingContext && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading context…</span>
              </div>
            )}

            {hasContextError && (
              <div className="mt-2 text-sm text-destructive">{agencyError || clientsError}</div>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              {agency && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {agency.name}
                </span>
              )}
              {agency && activeClient && <span className="text-border">·</span>}
              {activeClient && (
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {activeClient.name ?? activeClient.id}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Button className="gap-2" onClick={handleOpenNewCampaignModal} disabled={!activeClientId}>
              <Plus className="w-4 h-4" />
              {t('newCampaign')}
            </Button>
            {!activeClientId && (
              <p className="text-xs text-muted-foreground max-w-[220px] text-right">{t('selectClientFirst')}</p>
            )}
          </div>
        </div>

        {/* Loading state */}
        {isCampaignsLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-sm">Loading campaigns…</p>
          </div>
        )}

        {/* Error state */}
        {campaignsError && !isCampaignsLoading && (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-destructive/30 rounded-xl bg-destructive/5 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <p className="font-medium text-destructive mb-1">Failed to load campaigns</p>
            <p className="text-sm text-muted-foreground">{(campaignsError as Error).message}</p>
          </div>
        )}

        {/* No client selected */}
        {!activeClientId && !isCampaignsLoading && !campaignsError && (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border rounded-xl bg-card text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-1">{t('selectClient')}</p>
            <p className="text-sm text-muted-foreground mb-1">
              {language === 'en' ? 'Select a client from the header to view and create campaigns.' : 'Selecciona un cliente en el encabezado para ver y crear campañas.'}
            </p>
            <p className="text-sm text-muted-foreground">{t('selectClientFirst')}</p>
          </div>
        )}

        {/* Campaigns list */}
        {!isCampaignsLoading && !campaignsError && activeClientId && (
          <>
            {/* Stats bar */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-muted-foreground">
                {campaigns.length} {campaigns.length === 1 ? t('campaign') : t('campaignsCount')}
              </span>
            </div>

            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border rounded-xl bg-card text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FolderOpen className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground mb-1">{t('noCampaigns')}</p>
                <p className="text-sm text-muted-foreground mb-6">{t('noCampaignsDesc')}</p>
                <Button className="gap-2" onClick={handleOpenNewCampaignModal}>
                  <Plus className="w-4 h-4" />
                  {t('newCampaign')}
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left px-5 py-3.5 font-medium text-muted-foreground">{t('campaign')}</th>
                        <th className="text-left px-5 py-3.5 font-medium text-muted-foreground">{t('objective')}</th>
                        <th className="text-left px-5 py-3.5 font-medium text-muted-foreground">{t('language')}</th>
                        <th className="text-left px-5 py-3.5 font-medium text-muted-foreground">{t('status')}</th>
                        <th className="text-right px-5 py-3.5 font-medium text-muted-foreground">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((campaign, idx) => (
                        <tr
                          key={campaign.id}
                          className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${idx % 2 === 1 ? 'bg-muted/10' : ''}`}
                        >
                          <td className="px-5 py-4">
                            <span className="font-medium text-foreground">{campaign.name}</span>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">{campaign.objective}</td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                              {campaign.language}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <Badge className={`border text-xs font-medium ${statusClassMap[campaign.status]}`}>
                              {t(statusKeyMap[campaign.status])}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                                <FolderOpen className="w-3.5 h-3.5" />
                                {t('open')}
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => handleOpenEditModal(campaign)}>
                                <Pencil className="w-3.5 h-3.5" />
                                {t('edit')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                                onClick={() => setDeleteTargetId(campaign.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden flex flex-col gap-3">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{campaign.objective}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                              <FolderOpen className="w-4 h-4 mr-2" />
                              {t('open')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEditModal(campaign)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              {t('edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTargetId(campaign.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t('delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge className={`border text-xs ${statusClassMap[campaign.status]}`}>
                          {t(statusKeyMap[campaign.status])}
                        </Badge>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                          {campaign.language}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* New Campaign Modal */}
      <Dialog open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('newCampaign')}</DialogTitle>
            <DialogDescription>{t('newCampaignDesc')}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {language === 'en' ? 'Active context' : 'Contexto activo'}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{t('agency')}:</span>
              <span className="font-medium text-foreground">{agency?.name ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{t('client')}:</span>
              <span className="font-medium text-foreground">{activeClient ? (activeClient.name ?? activeClient.id) : '—'}</span>
            </div>
            {!activeClientId && (
              <p className="text-xs text-destructive mt-1" role="alert">{t('selectClientFirst')}</p>
            )}
          </div>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">{t('campaignName')}</Label>
              <Input
                id="campaign-name"
                placeholder={t('campaignNamePlaceholder')}
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-objective">{t('objective')}</Label>
              <Input
                id="campaign-objective"
                placeholder={t('objectivePlaceholder')}
                value={newCampaignObjective}
                onChange={(e) => setNewCampaignObjective(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-language">{t('language')}</Label>
              <Select value={newCampaignLanguage} onValueChange={(v) => setNewCampaignLanguage(v as 'es' | 'en')}>
                <SelectTrigger id="campaign-language" className="h-10">
                  <SelectValue placeholder={t('selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_LANGUAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setIsNewCampaignOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="button" onClick={handleCreateCampaign} disabled={createMutation.isPending || !activeClientId}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Modal */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{language === 'en' ? 'Edit campaign' : 'Editar campaña'}</DialogTitle>
            <DialogDescription>{language === 'en' ? 'Update campaign name, objective and language.' : 'Actualiza el nombre, objetivo e idioma de la campaña.'}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-campaign-name">{t('campaignName')}</Label>
              <Input
                id="edit-campaign-name"
                placeholder={t('campaignNamePlaceholder')}
                value={editCampaignName}
                onChange={(e) => setEditCampaignName(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-campaign-objective">{t('objective')}</Label>
              <Input
                id="edit-campaign-objective"
                placeholder={t('objectivePlaceholder')}
                value={editCampaignObjective}
                onChange={(e) => setEditCampaignObjective(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-campaign-language">{t('language')}</Label>
              <Select value={editCampaignLanguage} onValueChange={(v) => setEditCampaignLanguage(v as 'es' | 'en')}>
                <SelectTrigger id="edit-campaign-language" className="h-10">
                  <SelectValue placeholder={t('selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_LANGUAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
              {t('cancel')}
            </Button>
            <Button type="button" onClick={handleSaveEdit} disabled={updateMutation.isPending || !editCampaignName.trim()}>
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteCampaign')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteCampaignDesc')}{' '}
              <span className="font-medium text-foreground">"{deleteTarget?.name}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTargetId && handleDelete(deleteTargetId)}
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Campaigns;
