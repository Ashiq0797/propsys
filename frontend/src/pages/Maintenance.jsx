import { useEffect, useMemo, useState } from 'react'
import { api, errorMessage } from '../api/client'
import { DataTable } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { FormField, inputCls } from '../components/FormField'
import { useToast } from '../components/Toast'

const EMPTY = { property_id: '', issue: '' }

export function Maintenance() {
  const [rows, setRows] = useState([])
  const [properties, setProperties] = useState([])
  const [propertyFilter, setPropertyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (propertyFilter) params.set('property_id', propertyFilter)
    if (statusFilter) params.set('status', statusFilter)
    const qs = params.toString()
    Promise.all([
      api.get(qs ? `/maintenance?${qs}` : '/maintenance'),
      api.get('/properties'),
    ])
      .then(([m, p]) => {
        setRows(m.data)
        setProperties(p.data)
      })
      .catch((e) => toast(errorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [propertyFilter, statusFilter])

  const propMap = useMemo(() => Object.fromEntries(properties.map((p) => [p.id, p])), [properties])

  const openNew = () => {
    setForm({ ...EMPTY, property_id: propertyFilter || '' })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!form.property_id) e.property_id = 'Pick a property'
    if (!form.issue.trim()) e.issue = 'Describe the issue'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await api.post('/maintenance', {
        property_id: Number(form.property_id),
        issue: form.issue,
      })
      setModalOpen(false)
      load()
    } catch (e) {
      toast(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const close = async (row) => {
    try {
      await api.put(`/maintenance/${row.id}`, { status: 'closed' })
      load()
    } catch (e) {
      toast(errorMessage(e))
    }
  }

  const remove = async (row) => {
    if (!confirm('Delete this maintenance request?')) return
    try {
      await api.delete(`/maintenance/${row.id}`)
      load()
    } catch (e) {
      toast(errorMessage(e))
    }
  }

  const columns = [
    { key: 'id', label: '#', render: (r) => `#${r.id}` },
    {
      key: 'property_id',
      label: 'Property',
      render: (r) => propMap[r.property_id]?.address || `property ${r.property_id}`,
    },
    { key: 'issue', label: 'Issue' },
    {
      key: 'created_at',
      label: 'Raised',
      render: (r) => (r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span
          className={`inline-block px-2 py-0.5 text-xs rounded ${
            r.status === 'open'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {r.status}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Maintenance</h1>
        <div className="flex items-center gap-3">
          <select
            className={inputCls + ' w-52'}
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
          >
            <option value="">All properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.address}</option>
            ))}
          </select>
          <select
            className={inputCls + ' w-36'}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Any status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          <button
            onClick={openNew}
            className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            + New request
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          empty="No maintenance requests"
          rowActions={(row) => (
            <>
              {row.status === 'open' && (
                <button
                  onClick={() => close(row)}
                  className="text-slate-600 hover:text-emerald-700 text-xs mr-3"
                >
                  Close
                </button>
              )}
              <button
                onClick={() => remove(row)}
                className="text-slate-600 hover:text-red-700 text-xs"
              >
                Delete
              </button>
            </>
          )}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New maintenance request"
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
        <FormField label="Property" error={errors.property_id}>
          <select
            className={inputCls}
            value={form.property_id}
            onChange={(e) => setForm({ ...form, property_id: e.target.value })}
          >
            <option value="">Select…</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.address}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Issue" error={errors.issue}>
          <textarea
            className={inputCls + ' h-24'}
            value={form.issue}
            onChange={(e) => setForm({ ...form, issue: e.target.value })}
          />
        </FormField>
      </Modal>
    </div>
  )
}