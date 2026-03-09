import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import { mockClients, mockCampaigns } from '@/lib/mockData';
import { Plus, FolderKanban, Building2 } from 'lucide-react';

const Clients = () => {
  const { language, selectedAgencyId, setSelectedClientId } = useApp();
  const t = useTranslation(language);

  const agencyClients = mockClients.filter((c) => c.agencyId === selectedAgencyId);

  const getClientCampaigns = (clientId: string) => {
    return mockCampaigns.filter((c) => c.clientId === clientId);
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
  };

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
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {language === 'en' ? 'Add Client' : 'Agregar Cliente'}
          </Button>
        </div>

        {agencyClients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {language === 'en' ? 'No clients yet' : 'Sin clientes aún'}
              </p>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {language === 'en' ? 'Add First Client' : 'Agregar Primer Cliente'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agencyClients.map((client) => {
              const campaigns = getClientCampaigns(client.id);
              const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;

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
                    <CardTitle className="text-xl">{client.name}</CardTitle>
                    <CardDescription>
                      {campaigns.length} {language === 'en' ? 'campaigns' : 'campañas'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FolderKanban className="w-4 h-4" />
                      <span>
                        {campaigns.length === 0
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
