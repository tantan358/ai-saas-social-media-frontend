import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import { mockCampaigns, mockClients, mockAgencies } from '@/lib/mockData';
import { FolderKanban, TrendingUp, Users, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { language, selectedAgencyId, selectedClientId } = useApp();
  const t = useTranslation(language);

  const selectedAgency = mockAgencies.find((a) => a.id === selectedAgencyId);
  const selectedClient = mockClients.find((c) => c.id === selectedClientId);

  const filteredCampaigns = mockCampaigns.filter(
    (c) => c.agencyId === selectedAgencyId && (!selectedClientId || c.clientId === selectedClientId)
  );

  const activeCampaigns = filteredCampaigns.filter((c) => c.status === 'active').length;

  const stats = [
    {
      title: t('activeCampaigns'),
      value: activeCampaigns,
      icon: FolderKanban,
      color: 'text-primary',
    },
    {
      title: 'Total Posts',
      value: activeCampaigns * 8,
      icon: Calendar,
      color: 'text-success',
    },
    {
      title: 'Engagement Rate',
      value: '12.4%',
      icon: TrendingUp,
      color: 'text-accent-foreground',
    },
    {
      title: 'Clients',
      value: mockClients.filter((c) => c.agencyId === selectedAgencyId).length,
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
            {selectedAgency?.name} {selectedClient && ` → ${selectedClient.name}`}
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
            <div className="space-y-4">
              {filteredCampaigns.slice(0, 3).map((campaign) => {
                const client = mockClients.find((c) => c.id === campaign.clientId);
                return (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground">{client?.name}</p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-accent text-accent-foreground capitalize">
                      {campaign.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
