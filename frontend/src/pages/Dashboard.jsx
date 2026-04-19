import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage, CURRENT_TENANT_ID } from '../api/client'
import { useToast } from '../components/Toast'

function Card({ label, value, tone = 'default', sub }) {
  const toneCls =
    tone === 'warn'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : tone === 'bad'
      ? 'text-red-700 bg-red-50 border-red-200'
      : tone === 'good'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : 'text-slate-900 bg-white border-slate-200'
  return (
    <div className={`rounded-lg border p-4 ${toneCls}`}>
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  )
}

function paymentTone(status) {
  if (status === 'overdue') return 'bad'
  if (status === 'pending') return 'warn'
  return 'good'
}

export function Dashboard() {
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    api.get(`/me?tenant_id=${CURRENT_TENANT_ID}`)
      .then((r) => setMe(r.data))
      .catch((e) => toast(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [toast])

  if (loading) return <div className="text-slate-500">Loading…</div>
  if (!me) return <div className="text-slate-500">No data.</div>

  const firstName = me.tenant.name.split(' ')[0]
  const { lease, next_payment, open_maintenance_count } = me

  if (!lease) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-2">Hi {firstName}</h1>
        <p className="text-slate-600">You don't have an active lease right now.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Hi {firstName}</h1>
      <p className="text-slate-600 mb-6">{lease.property.address}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          label="Monthly rent"
          value={`£${lease.monthly_rent_at_time.toLocaleString()}`}
          sub={`${lease.property.type} · ${lease.property.bedrooms} bed`}
        />
        {next_payment ? (
          <Card
            label="Next rent due"
            value={`£${next_payment.amount.toLocaleString()}`}
            sub={`${new Date(next_payment.due_date).toLocaleDateString()} · ${next_payment.status}`}
            tone={paymentTone(next_payment.status)}
          />
        ) : (
          <Card label="Next rent due" value="All caught up" tone="good" />
        )}
        <Card
          label="Open maintenance"
          value={open_maintenance_count}
          tone={open_maintenance_count > 0 ? 'warn' : 'default'}
          sub={open_maintenance_count > 0 ? 'Awaiting fix' : 'Nothing pending'}
        />
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          to="/lease"
          className="px-3 py-1.5 rounded bg-slate-200 text-sm hover:bg-slate-300"
        >
          View lease
        </Link>
        <Link
          to="/rent"
          className="px-3 py-1.5 rounded bg-slate-200 text-sm hover:bg-slate-300"
        >
          Rent history
        </Link>
        <Link
          to="/maintenance"
          className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          Report an issue
        </Link>
      </div>
    </div>
  )
}
