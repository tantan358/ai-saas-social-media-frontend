import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CreateClientModal from '@/components/CreateClientModal';
import EditClientModal from '@/components/EditClientModal';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import { fetchCampaigns, archiveClient } from '@/services/api';
import type { Client } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, FolderKanban, Building2, Loader2, MoreVertical, Pencil, Archive, ExternalLink, AlertTriangle } from 'lucide-react';

const Clients = () => {
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [archiveConfirmClient, setArchiveConfirmClient] = useState<Client | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    language,
    selectedClientId,
    setSelectedClientId,
    clients,
    isClientsLoading,
    clientsError,
  } = useApp();
  const t = useTranslation(language);

  const handleCreateSuccess = (client: { id: string }) => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    setSelectedClientId(client.id);
  };

  // Backend GET /clients returns only the current user's agency clients
  const agencyClients = clients;

  const campaignQueries = useQueries({
    queries: agencyClients.map((client) => ({
      queryKey: ['campaigns', client.id],
      queryFn: () => fetchCampaigns(client.id),
      enabled: !!client.id,
    })),
  });

  const getClientCampaigns = (clientIndex: number) => {
    const result = campaignQueries[clientIndex]?.data;
    return result ?? [];
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleOpenClient = (clientId: string) => {
    setSelectedClientId(clientId);
    navigate('/campaigns');
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    setEditingClient(null);
  };

  const handleArchiveConfirm = async () => {
    if (!archiveConfirmClient) return;
    setIsArchiving(true);
    try {
      await archiveClient(archiveConfirmClient.id);
      toast({
        title: language === 'es' ? 'Cliente archivado' : 'Client archived',
        description:
          language === 'es'
            ? 'El cliente se ha archivado correctamente.'
            : 'The client has been archived successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setArchiveConfirmClient(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      toast({
        variant: 'destructive',
        title: language === 'es' ? 'Error al archivar' : 'Archive failed',
        description: message,
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleArchiveDialogOpenChange = (open: boolean) => {
    if (!open && !isArchiving) setArchiveConfirmClient(null);
  };

  if (isClientsLoading) {
    return (
      <MainLayout>
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('clients')}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {language === 'en' ? 'Loading clients…' : 'Cargando clientes…'}
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-muted mb-2" />
                  <div className="h-6 w-32 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (clientsError) {
    return (
      <MainLayout>
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
          <div className="mb-10">
            <h1 className="text-3xl font-bold mb-2">{t('clients')}</h1>
          </div>
          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-destructive font-medium mb-2">
                {language === 'en' ? 'Failed to load clients' : 'Error al cargar clientes'}
              </p>
              <p className="text-muted-foreground text-sm">{clientsError}</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('clients')}</h1>
            <p className="text-muted-foreground mt-1">
              {agencyClients.length} {agencyClients.length === 1
                ? (language === 'en' ? 'client' : 'cliente')
                : (language === 'en' ? 'clients' : 'clientes')}
            </p>
          </div>
          <Button className="gap-2 shrink-0 w-full sm:w-auto" onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            {language === 'en' ? 'Add Client' : 'Agregar Cliente'}
          </Button>
        </div>

        <CreateClientModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={handleCreateSuccess}
          language={language}
        />

        <EditClientModal
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
          client={editingClient}
          onSuccess={handleEditSuccess}
          language={language}
        />

        <AlertDialog open={!!archiveConfirmClient} onOpenChange={handleArchiveDialogOpenChange}>
          <AlertDialogContent className="sm:max-w-md">
            {archiveConfirmClient && (() => {
              const archiveClientIndex = agencyClients.findIndex((c) => c.id === archiveConfirmClient.id);
              const archiveCampaigns = archiveClientIndex >= 0 ? getClientCampaigns(archiveClientIndex) : [];
              const archiveCampaignsLoading = archiveClientIndex >= 0 && campaignQueries[archiveClientIndex]?.isLoading;
              const hasCampaigns = archiveCampaigns.length > 0;
              const clientDisplayName = archiveConfirmClient.name ?? archiveConfirmClient.id;

              return (
                <>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {language === 'en' ? 'Archive client?' : '¿Archivar cliente?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-3">
                        <p>
                          {language === 'en'
                            ? 'Are you sure you want to archive this client?'
                            : '¿Estás seguro de que deseas archivar este cliente?'}
                        </p>
                        {archiveCampaignsLoading && (
                          <p className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                            {language === 'en' ? 'Checking campaigns…' : 'Comprobando campañas…'}
                          </p>
                        )}
                        {!archiveCampaignsLoading && !hasCampaigns && (
                          <p className="text-muted-foreground">
                            {language === 'en'
                              ? `"${clientDisplayName}" will be archived. You can restore it later from archived clients.`
                              : `"${clientDisplayName}" se archivarán. Podrás restaurarlo más tarde.`}
                          </p>
                        )}
                        {!archiveCampaignsLoading && hasCampaigns && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>
                              {language === 'en' ? 'Cannot delete' : 'No se puede eliminar'}
                            </AlertTitle>
                            <AlertDescription>
                              <p className="mb-1.5">
                                {language === 'en'
                                  ? 'This client has campaigns and cannot be deleted directly.'
                                  : 'Este cliente tiene campañas y no se puede eliminar directamente.'}
                              </p>
                              <p className="text-destructive/90">
                                {language === 'en'
                                  ? 'You can archive this client once all campaigns have been removed or reassigned.'
                                  : 'Puedes archivar este cliente cuando todas las campañas se hayan eliminado o reasignado.'}
                              </p>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setArchiveConfirmClient(null)} disabled={isArchiving}>
                      {language === 'en' ? 'Cancel' : 'Cancelar'}
                    </AlertDialogCancel>
                    {!archiveCampaignsLoading && !hasCampaigns && (
                      <AlertDialogAction
                        onClick={handleArchiveConfirm}
                        disabled={isArchiving}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isArchiving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            {language === 'en' ? 'Archiving…' : 'Archivando…'}
                          </>
                        ) : (
                          language === 'en' ? 'Archive' : 'Archivar'
                        )}
                      </AlertDialogAction>
                    )}
                  </AlertDialogFooter>
                </>
              );
            })()}
          </AlertDialogContent>
        </AlertDialog>

        {agencyClients.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-24 px-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {language === 'en' ? 'No clients yet' : 'Sin clientes aún'}
              </h2>
              <p className="text-muted-foreground text-center text-sm max-w-sm mb-6">
                {language === 'en'
                  ? 'Create your first client to start managing campaigns.'
                  : 'Crea tu primer cliente para empezar a gestionar campañas.'}
              </p>
              <Button
                size="lg"
                className="gap-2"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="w-5 h-5" />
                {language === 'en' ? 'Add First Client' : 'Agregar Primer Cliente'}
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                {language === 'en' ? 'You can also use the button above.' : 'También puedes usar el botón de arriba.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {agencyClients.map((client, index) => {
              const campaigns = getClientCampaigns(index);
              const activeCampaigns = campaigns.filter(
                (c) => !['completed', 'cancelled'].includes(c.status)
              ).length;
              const campaignsLoading = campaignQueries[index]?.isLoading;
              const isSelected = client.id === selectedClientId;
              const recentCampaigns = campaigns.slice(0, 3);

              return (
                <Card
                  key={client.id}
                  className={`
                    transition-all cursor-pointer group
                    hover:shadow-md
                    ${isSelected
                      ? 'ring-2 ring-primary border-primary/50 shadow-sm'
                      : 'hover:border-border'}
                  `}
                  onClick={() => handleSelectClient(client.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-lg font-semibold truncate">
                            {client.name ?? client.id}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {isSelected && (
                              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                                {language === 'en' ? 'Current' : 'Actual'}
                              </Badge>
                            )}
                            {activeCampaigns > 0 && (
                              <Badge variant="secondary" className="text-xs bg-success/10 text-success border-0">
                                {activeCampaigns} {language === 'en' ? 'active' : 'activas'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={language === 'en' ? 'Client actions' : 'Acciones del cliente'}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenClient(client.id);
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {language === 'en' ? 'Open' : 'Abrir'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingClient(client);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            {language === 'en' ? 'Edit' : 'Editar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive data-[disabled]:opacity-100"
                            disabled={campaigns.length > 0}
                            title={
                              campaigns.length > 0
                                ? language === 'en'
                                  ? 'This client has campaigns and cannot be deleted directly.'
                                  : 'Este cliente tiene campañas y no se puede eliminar directamente.'
                                : undefined
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              if (campaigns.length === 0) setArchiveConfirmClient(client);
                            }}
                          >
                            <Archive className="h-4 w-4 mr-2 shrink-0" />
                            <span className="flex flex-col items-start">
                              <span>{language === 'en' ? 'Archive' : 'Archivar'}</span>
                              {campaigns.length > 0 && (
                                <span className="text-xs font-normal text-muted-foreground mt-0.5">
                                  {language === 'en'
                                    ? 'Has campaigns — cannot delete'
                                    : 'Tiene campañas — no se puede eliminar'}
                                </span>
                              )}
                            </span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    {/* Campaign count */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FolderKanban className="w-4 h-4 shrink-0" />
                      <span>
                        {campaignsLoading
                          ? language === 'en'
                            ? 'Loading…'
                            : 'Cargando…'
                          : campaigns.length === 0
                            ? language === 'en'
                              ? '0 campaigns'
                              : '0 campañas'
                            : `${campaigns.length} ${campaigns.length === 1
                              ? (language === 'en' ? 'campaign' : 'campaña')
                              : (language === 'en' ? 'campaigns' : 'campañas')}`}
                      </span>
                    </div>

                    {/* Recent campaigns or empty state */}
                    <div className="border-t border-border/80 pt-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        {language === 'en' ? 'Recent campaigns' : 'Campañas recientes'}
                      </p>
                      {campaignsLoading ? (
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' ? 'Loading…' : 'Cargando…'}
                        </p>
                      ) : campaigns.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {language === 'en'
                            ? 'No campaigns yet. Create one from the Campaigns page.'
                            : 'Sin campañas aún. Crea una desde la página Campañas.'}
                        </p>
                      ) : (
                        <ul className="text-sm text-foreground space-y-1">
                          {recentCampaigns.map((c) => (
                            <li key={c.id} className="truncate">
                              {c.name}
                            </li>
                          ))}
                          {campaigns.length > 3 && (
                            <li className="text-muted-foreground text-xs">
                              +{campaigns.length - 3} {language === 'en' ? 'more' : 'más'}
                            </li>
                          )}
                        </ul>
                      )}
                    </div>

                    {!campaignsLoading && campaigns.length > 0 && (
                      <p className="text-xs text-muted-foreground pt-1">
                        {language === 'en'
                          ? 'Archive unavailable — remove or reassign campaigns first.'
                          : 'Archivar no disponible — elimina o reasigna las campañas antes.'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Clients;
