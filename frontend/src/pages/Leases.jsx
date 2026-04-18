import { useEffect, useMemo, useState } from 'react'
import { api, errorMessage } from '../api/client'
import { DataTable } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { FormField, inputCls } from '../components/FormField'
import { useToast } from '../components/Toast'

const EMPTY = {
  property_id: '',
  tenant_id: '',
  start_date: '',
  end_date: '',
  monthly_rent_at_time: '',
}

export function Leases() {
  const [leases, setLeases] = useState([])
  const [properties, setProperties] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/leases'),
      api.get('/properties'),
      api.get('/tenants'),
    ])
      .then(([l, p, t]) => {
        setLeases(l.data)
        setProperties(p.data)
        setTenants(t.data)
      })
      .catch((e) => toast(errorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const propMap = useMemo(() => Object.fromEntries(properties.map((p) => [p.id, p])), [properties])
  const tenantMap = useMemo(() => Object.fromEntries(tenants.map((t) => [t.id, t])), [tenants])
  const availableProps = useMemo(() => properties.filter((p) => p.status === 'available'), [properties])

  const openNew = () => {
    setForm(EMPTY)
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!form.property_id) e.property_id = 'Pick a property'
    if (!form.tenant_id) e.tenant_id = 'Pick a tenant'
    if (!form.start_date) e.start_date = 'Required'
    if (!form.end_date) e.end_date = 'Required'
    if (!form.monthly_rent_at_time || Number(form.monthly_rent_at_time) <= 0) {
      e.monthly_rent_at_time = 'Must be a positive number'
    }
    if (form.start_date && form.end_date && form.start_date >= form.end_date) {
      e.end_date = 'End date must be after start date'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await api.post('/leases', {
        property_id: Number(form.property_id),
        tenant_id: Number(form.tenant_id),
        start_date: form.start_date,
        end_date: form.end_date,
        monthly_rent_at_time: Number(form.monthly_rent_at_time),
      })
      setModalOpen(false)
      load()
    } catch (e) {
      toast(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const terminate = async (row) => {
    if (!confirm(`Terminate lease #${row.id}?`)) return
    try {
      await api.post(`/leases/${row.id}/terminate`)
      load()
    } catch (e) {
      toast(errorMessage(e))
    }
  }

  const onPickProperty = (pid) => {
    const p = propMap[pid]
    setForm({
      ...form,
      property_id: pid,
      monthly_rent_at_time: p ? p.monthly_rent : form.monthly_rent_at_time,
    })
  }

  const columns = [
    { key: 'id', label: '#', render: (r) => `#${r.id}` },
    {
      key: 'tenant_id',
      label: 'Tenant',
      render: (r) => tenantMap[r.tenant_id]?.name || `tenant ${r.tenant_id}`,
    },
    {
      key: 'property_id',
      label: 'Property',
      render: (r) => propMap[r.property_id]?.address || `property ${r.property_id}`,
    },
    { key: 'start_date', label: 'Start' },
    { key: 'end_date', label: 'End' },
    {
      key: 'monthly_rent_at_time',
      label: 'Rent',
      render: (r) => `£${Number(r.monthly_rent_at_time).toLocaleString()}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span
          className={`inline-block px-2 py-0.5 text-xs rounded ${
            r.status === 'active'
              ? 'bg-emerald-100 text-emerald-800'
              : r.status === 'terminated'
              ? 'bg-slate-200 text-slate-700'
              : 'bg-amber-100 text-amber-800'
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
        <h1 className="text-2xl font-semibold">Leases</h1>
        <button
          onClick={openNew}
          className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          + New lease
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : (
        <DataTable
          columns={columns}
          rows={leases}
          empty="No leases yet"
          rowActions={(row) =>
            row.status === 'active' ? (
              <button
                onClick={() => terminate(row)}
                className="text-slate-600 hover:text-red-700 text-xs"
              >
                Terminate
              </button>
            ) : null
          }
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New lease"
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
        <FormField label="Property (available only)" error={errors.property_id}>
          <select
            className={inputCls}
            value={form.property_id}
            onChange={(e) => onPickProperty(e.target.value)}
          >
            <option value="">Select…</option>
            {availableProps.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}
              </option>
            ))}
          </select>
          {availableProps.length === 0 && (
            <span className="block text-xs text-amber-700 mt-1">
              No available properties — all are occupied.
            </span>
          )}
        </FormField>
        <FormField label="Tenant" error={errors.tenant_id}>
          <select
            className={inputCls}
            value={form.tenant_id}
            onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
          >
            <option value="">Select…</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.email})
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Start date" error={errors.start_date}>
          <input
            className={inputCls}
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />
        </FormField>
        <FormField label="End date" error={errors.end_date}>
          <input
            className={inputCls}
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
          />
        </FormField>
        <FormField label="Monthly rent (£)" error={errors.monthly_rent_at_time}>
          <input
            className={inputCls}
            type="number"
            min="0"
            step="0.01"
            value={form.monthly_rent_at_time}
            onChange={(e) =>
              setForm({ ...form, monthly_rent_at_time: e.target.value })
            }
          />
        </FormField>
      </Modal>
    </div>
  )
}
