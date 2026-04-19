import { useEffect, useState } from 'react'
import { api, errorMessage, CURRENT_TENANT_ID } from '../api/client'
import { useToast } from '../components/Toast'

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className="text-slate-900 text-sm font-medium">{value}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const cls =
    status === 'active'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'terminated'
      ? 'bg-red-100 text-red-800'
      : 'bg-slate-200 text-slate-700'
  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded ${cls}`}>{status}</span>
  )
}

export function MyLease() {
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
  if (!me?.lease) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-2">My Lease</h1>
        <p className="text-slate-600">No active lease on file.</p>
      </div>
    )
  }

  const { lease } = me
  const p = lease.property

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">My Lease</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Property</h2>
          <Row label="Address" value={p.address} />
          <Row label="Type" value={p.type} />
          <Row label="Bedrooms" value={p.bedrooms} />
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Lease terms</h2>
          <Row label="Status" value={<StatusBadge status={lease.status} />} />
          <Row label="Start" value={new Date(lease.start_date).toLocaleDateString()} />
          <Row label="End" value={new Date(lease.end_date).toLocaleDateString()} />
          <Row label="Monthly rent" value={`£${lease.monthly_rent_at_time.toLocaleString()}`} />
        </div>
      </div>
    </div>
  )
}
