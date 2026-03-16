import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Language } from '@/lib/i18n';
import { fetchClients, fetchMyAgency, type Agency, type Client } from '@/services/api';
import { logout as clearAuthTokens } from '@/services/auth';

/** Key for persisting selected client across reloads */
const SELECTED_CLIENT_STORAGE_KEY = 'nervia_selected_client_id';

/**
 * Global app context: active agency, active client, and client list.
 * Single source of truth for header, Clients page, Campaigns page, and campaign creation.
 */
export type AppContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  selectedAgencyId: string | null;
  setSelectedAgencyId: (id: string | null) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  /** Clear tokens and set unauthenticated; ProtectedRoute will redirect to /login */
  logout: () => void;

  agency: Agency | null;
  clients: Client[];
  isAgencyLoading: boolean;
  isClientsLoading: boolean;
  agencyError: string | null;
  clientsError: string | null;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function getStoredClientId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(SELECTED_CLIENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredClientId(id: string | null): void {
  try {
    if (id) localStorage.setItem(SELECTED_CLIENT_STORAGE_KEY, id);
    else localStorage.removeItem(SELECTED_CLIENT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(getStoredClientId);
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

  // Reset selection on logout and clear persisted client
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedAgencyId(null);
      setSelectedClientId(null);
      setStoredClientId(null);
    }
  }, [isAuthenticated]);

  // Keep active agency in sync with backend
  useEffect(() => {
    if (agencyQuery.data?.id) {
      setSelectedAgencyId(agencyQuery.data.id);
    }
  }, [agencyQuery.data?.id]);

  // Sync selected client with backend list. Active client fallback when list changes (e.g. after edit/archive):
  // - List empty (e.g. last client archived) → clear selection and storage → header shows "No client selected".
  // - List has items but current selection not in list (e.g. selected client archived) → switch to first available client.
  // - Selection stays valid → no change. Persist effect below saves the current selection so it survives reload.
  useEffect(() => {
    const list = clientsQuery.data ?? [];
    if (list.length === 0) {
      setSelectedClientId(null);
      setStoredClientId(null);
      return;
    }
    const selectionValid = selectedClientId && list.some((c) => c.id === selectedClientId);
    if (!selectionValid) {
      setSelectedClientId(list[0].id);
    }
  }, [clientsQuery.data, selectedClientId]);

  // Persist selected client so it survives page reload
  useEffect(() => {
    if (selectedClientId) setStoredClientId(selectedClientId);
    else setStoredClientId(null);
  }, [selectedClientId]);

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
      logout: () => {
        clearAuthTokens();
        setIsAuthenticated(false);
      },

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
