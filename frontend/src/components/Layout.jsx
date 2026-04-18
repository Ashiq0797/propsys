import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/properties', label: 'Properties' },
  { to: '/tenants', label: 'Tenants' },
  { to: '/leases', label: 'Leases' },
  { to: '/payments', label: 'Payments' },
  { to: '/maintenance', label: 'Maintenance' },
]

export function Layout() {
  return (
    <div className="flex h-full">
      <aside className="w-56 bg-slate-900 text-slate-100 p-4 flex flex-col gap-1">
        <div className="text-xl font-bold mb-4 px-2">PropSys</div>
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
