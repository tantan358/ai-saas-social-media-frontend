export interface User {
  id: number
  email: string
  full_name: string
  role: string
  tenant_id: number
}

export interface Tenant {
  id: number
  name: string
  slug: string
}
