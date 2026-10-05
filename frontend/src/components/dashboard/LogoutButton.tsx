import { LogOut } from 'lucide-react'
import { clearSession } from '../../api/client'

function LogoutButton() {
  const handleLogout = () => {
    clearSession()
    window.location.replace('/')
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      aria-label="Déconnexion"
      className="group fixed right-6 top-6 inline-flex h-12 w-12 items-center justify-center rounded-md bg-red-600 text-white shadow-md transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
    >
      <LogOut size={20} aria-hidden="true" />
      <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded bg-gray-900 px-3 py-2 text-sm text-white opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        Déconnexion
      </span>
    </button>
  )
}

export default LogoutButton
