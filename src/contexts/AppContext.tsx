import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Language } from '@/lib/i18n';
import { fetchClients, fetchMyAgency, type Agency, type Client } from '@/services/api';

type AppContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  selectedAgencyId: string | null;
  setSelectedAgencyId: (id: string | null) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;

  agency: Agency | null;
  clients: Client[];
  isAgencyLoading: boolean;
  isClientsLoading: boolean;
  agencyError: string | null;
  clientsError: string | null;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!(localStorage.getItem('access_token') || localStorage.getItem('token'));
  });

  const agencyQuery = useQuery({
    queryKey: ['agency', 'me'],
    queryFn: fetchMyAgency,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    retry: 1,
  });

  // Reset selection on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedAgencyId(null);
      setSelectedClientId(null);
    }
  }, [isAuthenticated]);

  // Keep active agency in sync with backend
  useEffect(() => {
    if (agencyQuery.data?.id) {
      setSelectedAgencyId(agencyQuery.data.id);
    }
  }, [agencyQuery.data?.id]);

  // Default/select a valid client once clients load
  useEffect(() => {
    const list = clientsQuery.data ?? [];
    if (!list.length) return;

    if (!selectedClientId || !list.some((c) => c.id === selectedClientId)) {
      setSelectedClientId(list[0].id);
    }
  }, [clientsQuery.data, selectedClientId]);

  const value = useMemo<AppContextType>(
    () => ({
      language,
      setLanguage,
      selectedAgencyId,
      setSelectedAgencyId,
      selectedClientId,
      setSelectedClientId,
      isAuthenticated,
      setIsAuthenticated,

      agency: agencyQuery.data ?? null,
      clients: clientsQuery.data ?? [],
      isAgencyLoading: agencyQuery.isLoading,
      isClientsLoading: clientsQuery.isLoading,
      agencyError: agencyQuery.error ? (agencyQuery.error as Error).message : null,
      clientsError: clientsQuery.error ? (clientsQuery.error as Error).message : null,
    }),
    [
      language,
      selectedAgencyId,
      selectedClientId,
      isAuthenticated,
      agencyQuery.data,
      agencyQuery.isLoading,
      agencyQuery.error,
      clientsQuery.data,
      clientsQuery.isLoading,
      clientsQuery.error,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
