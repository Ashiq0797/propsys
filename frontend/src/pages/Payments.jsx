import { useEffect, useMemo, useState } from 'react'
import { api, errorMessage } from '../api/client'
import { DataTable } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { FormField, inputCls } from '../components/FormField'
import { useToast } from '../components/Toast'

const EMPTY = {
  lease_id: '',
  amount: '',
  due_date: '',
  paid_date: '',
  method: 'bank_transfer',
}

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

export function Payments() {
  const [payments, setPayments] = useState([])
  const [leases, setLeases] = useState([])
  const [tenants, setTenants] = useState([])
  const [properties, setProperties] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const load = () => {
    setLoading(true)
    const paymentsUrl = filter ? `/payments?lease_id=${filter}` : '/payments'
    Promise.all([
      api.get(paymentsUrl),
      api.get('/leases'),
      api.get('/tenants'),
      api.get('/properties'),
    ])
      .then(([pm, l, t, p]) => {
        setPayments(pm.data)
        setLeases(l.data)
        setTenants(t.data)
        setProperties(p.data)
      })
      .catch((e) => toast(errorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filter])

  const tenantMap = useMemo(() => Object.fromEntries(tenants.map((t) => [t.id, t])), [tenants])
  const propMap = useMemo(() => Object.fromEntries(properties.map((p) => [p.id, p])), [properties])
  const leaseLabel = (l) =>
    `#${l.id} — ${tenantMap[l.tenant_id]?.name || '?'} @ ${
      propMap[l.property_id]?.address || '?'
    }`

  const openNew = () => {
    setForm({ ...EMPTY, lease_id: filter || '' })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!form.lease_id) e.lease_id = 'Pick a lease'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Must be a positive number'
    if (!form.due_date) e.due_date = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await api.post('/payments', {
        lease_id: Number(form.lease_id),
        amount: Number(form.amount),
        due_date: form.due_date,
        paid_date: form.paid_date || null,
        method: form.method,
      })
      setModalOpen(false)
      load()
    } catch (e) {
      toast(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const markPaid = async (row) => {
    const today = new Date().toISOString().slice(0, 10)
    try {
      await api.put(`/payments/${row.id}`, { paid_date: today })
      load()
    } catch (e) {
      toast(errorMessage(e))
    }
  }

  const columns = [
    { key: 'id', label: '#', render: (r) => `#${r.id}` },
    {
      key: 'lease_id',
      label: 'Lease',
      render: (r) => {
        const lease = leases.find((l) => l.id === r.lease_id)
        return lease ? leaseLabel(lease) : `Lease ${r.lease_id}`
      },
    },
    { key: 'amount', label: 'Amount', render: (r) => `£${r.amount}` },
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
      render: (r) => {
        const today = new Date()
        const dueDate = new Date(r.due_date)
        if (r.paid_date) return <StatusBadge status="paid" />
        if (dueDate < today) return <StatusBadge status="overdue" />
        return <StatusBadge status="pending" />
      },
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Payments</h1>
        <div className="flex items-center gap-3">
          <select
            className={inputCls + ' w-64'}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All payments</option>
            {leases.map((l) => (
              <option key={l.id} value={l.id}>
                {leaseLabel(l)}
              </option>
            ))}
          </select>
          <button
            onClick={openNew}
            className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            + New payment
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : (
        <DataTable
          columns={columns}
          rows={payments}
          empty="No payments"
          rowActions={(row) => (
            <>
              {!row.paid_date && (
                <button
                  onClick={() => markPaid(row)}
                  className="text-slate-600 hover:text-emerald-700 text-xs mr-3"
                >
                  Mark paid
                </button>
              )}
            </>
          )}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New payment"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-3 py-1.5 rounded bg-slate-200 text-sm hover:bg-slate-300"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <FormField label="Lease" error={errors.lease_id}>
          <select
            className={inputCls}
            value={form.lease_id}
            onChange={(e) => setForm({ ...form, lease_id: e.target.value })}
          >
            <option value="">Select…</option>
            {leases.map((l) => (
              <option key={l.id} value={l.id}>
                {leaseLabel(l)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Amount (£)" error={errors.amount}>
          <input
            type="number"
            step="0.01"
            className={inputCls}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </FormField>
        <FormField label="Due date" error={errors.due_date}>
          <input
            type="date"
            className={inputCls}
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </FormField>
        <FormField label="Paid date (optional)">
          <input
            type="date"
            className={inputCls}
            value={form.paid_date}
            onChange={(e) => setForm({ ...form, paid_date: e.target.value })}
          />
        </FormField>
        <FormField label="Payment method">
          <select
            className={inputCls}
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
          >
            <option value="bank_transfer">Bank transfer</option>
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="credit_card">Credit card</option>
          </select>
        </FormField>
      </Modal>
    </div>
  )
}
