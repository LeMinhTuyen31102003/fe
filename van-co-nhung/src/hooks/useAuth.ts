import { useEffect, useState } from 'react'

export interface AuthState {
  token: string | null
  userName: string | null
  fullName: string | null
  role: string | null
}

const AUTH_CHANGED_EVENT = 'auth-changed'

function readAuthState(): AuthState {
  return {
    token: localStorage.getItem('token'),
    userName: localStorage.getItem('userName'),
    fullName: localStorage.getItem('fullName'),
    role: localStorage.getItem('role'),
  }
}

export function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(readAuthState)

  useEffect(() => {
    function handleChange() {
      setAuth(readAuthState())
    }
    window.addEventListener(AUTH_CHANGED_EVENT, handleChange)
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handleChange)
  }, [])

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    localStorage.removeItem('fullName')
    localStorage.removeItem('role')
    setAuth({ token: null, userName: null, fullName: null, role: null })
  }

  return {
    ...auth,
    isLoggedIn: Boolean(auth.token),
    logout,
  }
}
