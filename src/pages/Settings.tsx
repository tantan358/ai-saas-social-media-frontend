import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';

const Settings = () => {
  const { language } = useApp();
  const t = useTranslation(language);

  return (
    <MainLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">{t('settings')}</h1>
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Settings panel will be available soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Settings;
