import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { agenciesApi, Agency } from '../api/agencies'
import { clientsApi, Client } from '../api/clients'

interface ContextSelectionState {
  agency: Agency | null
  clients: Client[]
  selectedClientId: string | null
  setSelectedClientId: (id: string | null) => void
  refetch: () => Promise<void>
  loading: boolean
}

const ContextSelectionContext = createContext<ContextSelectionState | undefined>(undefined)

export const ContextSelectionProvider = ({ children }: { children: ReactNode }) => {
  const [agency, setAgency] = useState<Agency | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      const [agencyRes, clientsRes] = await Promise.all([
        agenciesApi.getMe(),
        clientsApi.list(),
      ])
      setAgency(agencyRes)
      setClients(clientsRes)
      setSelectedClientId((prev) => {
        if (clientsRes.length === 0) return null
        const stillValid = prev && clientsRes.some((c) => c.id === prev)
        return stillValid ? prev : clientsRes[0].id
      })
    } catch {
      setAgency(null)
      setClients([])
      setSelectedClientId(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [])

  return (
    <ContextSelectionContext.Provider
      value={{
        agency,
        clients,
        selectedClientId,
        setSelectedClientId,
        refetch,
        loading,
      }}
    >
      {children}
    </ContextSelectionContext.Provider>
  )
}

export const useContextSelection = () => {
  const context = useContext(ContextSelectionContext)
  if (context === undefined) {
    throw new Error('useContextSelection must be used within ContextSelectionProvider')
  }
  return context
}
