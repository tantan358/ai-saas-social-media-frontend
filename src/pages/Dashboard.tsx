import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import { useQuery } from '@tanstack/react-query';
import { fetchCampaigns, type Campaign } from '@/services/api';
import { FolderKanban, TrendingUp, Users, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { language, agency, clients, selectedClientId } = useApp();
  const t = useTranslation(language);

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  const {
    data: campaigns = [],
    isLoading: isCampaignsLoading,
    error: campaignsError,
  } = useQuery({
    queryKey: ['dashboard-campaigns', selectedClientId],
    queryFn: () => fetchCampaigns(selectedClientId!),
    enabled: !!selectedClientId,
  });

  const activeCampaigns = campaigns.filter(
    (c: Campaign) => !['completed', 'cancelled'].includes(c.status)
  ).length;

  // TODO: wire Total Posts and Engagement Rate to real analytics endpoints when available.
  const totalPosts = 0;
  const engagementRateDisplay = '—';

  const stats = [
    {
      title: t('activeCampaigns'),
      value: activeCampaigns,
      icon: FolderKanban,
      color: 'text-primary',
    },
    {
      title: 'Total Posts',
      value: totalPosts,
      icon: Calendar,
      color: 'text-success',
    },
    {
      title: 'Engagement Rate',
      value: engagementRateDisplay,
      icon: TrendingUp,
      color: 'text-accent-foreground',
    },
    {
      title: 'Clients',
      value: clients.length,
      icon: Users,
      color: 'text-muted-foreground',
    },
  ];

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('dashboard')}</h1>
          <p className="text-muted-foreground">
            {agency?.name ?? '—'} {selectedClient && ` → ${selectedClient.name ?? selectedClient.id}`}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {campaignsError ? (
              <p className="text-sm text-destructive">
                {(campaignsError as Error).message || 'Failed to load campaigns.'}
              </p>
            ) : isCampaignsLoading ? (
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'Loading campaigns…' : 'Cargando campañas…'}
              </p>
            ) : campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {language === 'en'
                  ? 'No campaigns yet. Create a campaign to see activity here.'
                  : 'Aún no hay campañas. Crea una campaña para ver actividad aquí.'}
              </p>
            ) : (
              <div className="space-y-4">
                {campaigns.slice(0, 3).map((campaign) => {
                  const client = clients.find((c) => c.id === campaign.clientId);
                  return (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">{client?.name}</p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-accent text-accent-foreground capitalize">
                        {campaign.status.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
