import { useState } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CreateClientModal from '@/components/CreateClientModal';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import { fetchCampaigns } from '@/services/api';
import { Plus, FolderKanban, Building2, Loader2 } from 'lucide-react';

const Clients = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const {
    language,
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

  if (isClientsLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
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
        <div className="p-8">
          <div className="mb-8">
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
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('clients')}</h1>
            <p className="text-muted-foreground">
              {agencyClients.length} {language === 'en' ? 'clients' : 'clientes'}
            </p>
          </div>
          <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
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

        {agencyClients.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 px-8">
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agencyClients.map((client, index) => {
              const campaigns = getClientCampaigns(index);
              const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
              const campaignsLoading = campaignQueries[index]?.isLoading;

              return (
                <Card
                  key={client.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleSelectClient(client.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      {activeCampaigns > 0 && (
                        <Badge variant="secondary" className="bg-success/10 text-success">
                          {activeCampaigns} {language === 'en' ? 'Active' : 'Activas'}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{client.name ?? client.id}</CardTitle>
                    <CardDescription>
                      {campaignsLoading
                        ? language === 'en'
                          ? 'Loading…'
                          : 'Cargando…'
                        : `${campaigns.length} ${language === 'en' ? 'campaigns' : 'campañas'}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FolderKanban className="w-4 h-4 shrink-0" />
                      <span>
                        {campaignsLoading
                          ? language === 'en'
                            ? 'Loading campaigns…'
                            : 'Cargando campañas…'
                          : campaigns.length === 0
                            ? language === 'en'
                              ? 'No campaigns yet'
                              : 'Sin campañas'
                            : campaigns
                                .slice(0, 2)
                                .map((c) => c.name)
                                .join(', ')}
                      </span>
                    </div>
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
