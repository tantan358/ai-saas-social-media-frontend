import { ChevronDown, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Header = () => {
  const {
    language,
    setLanguage,
    selectedClientId,
    setSelectedClientId,
    setIsAuthenticated,
    agency,
    clients,
    isAgencyLoading,
    isClientsLoading,
    agencyError,
    clientsError,
  } = useApp();

  const t = useTranslation(language);

  const availableClients = useMemo(() => {
    if (!agency?.id) return clients;
    return clients.filter((c) => !c.agencyId || c.agencyId === agency.id);
  }, [clients, agency?.id]);

  const selectedClient = availableClients.find((c) => c.id === selectedClientId) ?? null;

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-8">
        {/* Agency display */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{t('agency')}:</span>
          <div className="flex items-center gap-2">
            {isAgencyLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            <span className={agencyError ? 'text-sm font-semibold text-destructive' : 'text-sm font-semibold text-foreground'}>
              {agencyError ? 'Failed to load' : agency?.name || '—'}
            </span>
          </div>
        </div>

        {/* Separator */}
        <div className="h-8 w-px bg-border" />

        {/* Client selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{t('client')}:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 font-semibold text-foreground hover:bg-accent"
                disabled={isClientsLoading || !!clientsError || availableClients.length === 0}
              >
                {isClientsLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {clientsError ? 'Clients unavailable' : selectedClient?.name || t('selectClient')}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {clientsError ? (
                <div className="px-2 py-1.5 text-sm text-destructive">Failed to load clients</div>
              ) : (
                availableClients.map((client) => (
                  <DropdownMenuItem key={client.id} onClick={() => setSelectedClientId(client.id)}>
                    {client.name || client.id}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Language toggle */}
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          <Button
            variant={language === 'en' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setLanguage('en')}
            className="h-8 px-3"
          >
            EN
          </Button>
          <Button
            variant={language === 'es' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setLanguage('es')}
            className="h-8 px-3"
          >
            ES
          </Button>
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 h-10 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">AD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-muted-foreground">admin@nervia.com</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>{t('logout')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
