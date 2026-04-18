import { useEffect, useState } from 'react'
import { api, errorMessage } from '../api/client'
import { useToast } from '../components/Toast'

function StatCard({ label, value, tone = 'default' }) {
  const toneCls =
    tone === 'warn'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : tone === 'bad'
      ? 'text-red-700 bg-red-50 border-red-200'
      : 'text-slate-900 bg-white border-slate-200'
  return (
    <div className={`rounded-lg border p-4 ${toneCls}`}>
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}

export function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((r) => setStats(r.data))
      .catch((e) => toast(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [toast])

  if (loading) return <div className="text-slate-500">Loading…</div>
  if (!stats) return <div className="text-slate-500">No stats available.</div>

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Properties" value={stats.total_properties} />
        <StatCard label="Occupied" value={stats.occupied} />
        <StatCard label="Available" value={stats.available} />
        <StatCard label="Occupancy Rate" value={stats.occupancy_rate} />
        <StatCard label="Active Leases" value={stats.active_leases} />
        <StatCard label="Monthly Income" value={`£${stats.monthly_rental_income.toLocaleString()}`} />
        <StatCard label="Collected" value={`£${stats.total_payments_collected.toLocaleString()}`} />
        <StatCard
          label="Overdue Payments"
          value={stats.overdue_payments_count}
          tone={stats.overdue_payments_count > 0 ? 'bad' : 'default'}
        />
        <StatCard
          label="Open Maintenance"
          value={stats.open_maintenance_count}
          tone={stats.open_maintenance_count > 0 ? 'warn' : 'default'}
        />
      </div>
    </div>
  )
}
