import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { api, CURRENT_TENANT_ID } from '../api/client'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/lease', label: 'My Lease' },
  { to: '/rent', label: 'My Rent' },
  { to: '/maintenance', label: 'Maintenance' },
]

export function Layout() {
  const [tenantName, setTenantName] = useState('')

  useEffect(() => {
    api.get(`/tenants/${CURRENT_TENANT_ID}`)
      .then((r) => setTenantName(r.data.name))
      .catch(() => setTenantName(''))
  }, [])

  return (
    <div className="flex h-full">
      <aside className="w-56 bg-slate-900 text-slate-100 p-4 flex flex-col gap-1">
        <div className="mb-4 px-2">
          <div className="text-xl font-bold">PropSys</div>
          {tenantName && (
            <div className="text-xs text-slate-400 mt-0.5">{tenantName}</div>
          )}
        </div>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `px-3 py-2 rounded text-sm ${
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
