import { useState } from 'react'

export interface AuthState {
  token: string | null
  userName: string | null
  role: string | null
}

function readAuthState(): AuthState {
  return {
    token: localStorage.getItem('token'),
    userName: localStorage.getItem('userName'),
    role: localStorage.getItem('role'),
  }
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(readAuthState)

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    localStorage.removeItem('role')
    setAuth({ token: null, userName: null, role: null })
  }

  return {
    ...auth,
    isLoggedIn: Boolean(auth.token),
    logout,
  }
}
