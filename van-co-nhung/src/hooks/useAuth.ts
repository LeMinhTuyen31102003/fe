import { useState } from 'react'

export interface AuthState {
  userName: string | null
  role: string | null
}

export function useAuth() {
  const [auth] = useState<AuthState>(() => ({
    userName: localStorage.getItem('userName'),
    role: localStorage.getItem('role'),
  }))

  return {
    ...auth,
    isLoggedIn: Boolean(auth.userName),
  }
}
