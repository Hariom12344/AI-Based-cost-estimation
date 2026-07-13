export type UserRole = 'Admin' | 'Engineer'

export interface User {
  id: number
  email: string
  role: UserRole
  is_active: boolean
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}
