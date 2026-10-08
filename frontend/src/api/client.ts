export const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const tokenKey = 'dashboard_token'
const userKey = 'dashboard_user'

export const getToken = () => localStorage.getItem(tokenKey)

export const setToken = (token: string) => localStorage.setItem(tokenKey, token)

export const setUser = (user: string) => localStorage.setItem(userKey, user)

export const clearSession = () => {
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(userKey)
}

export const authHeaders = () => {
  const token = getToken()
  if (!token) throw new Error('Session introuvable.')

  return { Authorization: `Bearer ${token}` }
}
