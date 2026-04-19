import { useEffect, useState } from 'react'
import { api, errorMessage, CURRENT_TENANT_ID } from '../api/client'
import { DataTable } from '../components/DataTable'
import { useToast } from '../components/Toast'

function StatusBadge({ status }) {
  const cls =
    status === 'paid'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'overdue'
      ? 'bg-red-100 text-red-800'
      : 'bg-amber-100 text-amber-800'
  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded ${cls}`}>{status}</span>
  )
}

export function MyRent() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    api.get(`/payments?tenant_id=${CURRENT_TENANT_ID}`)
      .then((r) => setPayments(r.data))
      .catch((e) => toast(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [toast])

  const columns = [
    { key: 'id', label: '#', render: (r) => `#${r.id}` },
    { key: 'amount', label: 'Amount', render: (r) => `£${r.amount.toLocaleString()}` },
    {
      key: 'due_date',
      label: 'Due',
      render: (r) => new Date(r.due_date).toLocaleDateString(),
    },
    {
      key: 'paid_date',
      label: 'Paid',
      render: (r) => (r.paid_date ? new Date(r.paid_date).toLocaleDateString() : '—'),
    },
    {
      key: 'method',
      label: 'Method',
      render: (r) => r.method.replace('_', ' '),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
  ]

  const sorted = [...payments].sort((a, b) => new Date(b.due_date) - new Date(a.due_date))

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">My Rent</h1>
      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : (
        <DataTable columns={columns} rows={sorted} empty="No payments on record" />
      )}
    </div>
  )
}
