import { useEffect, useState } from 'react'
import { api, errorMessage } from '../api/client'
import { DataTable } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { FormField, inputCls } from '../components/FormField'
import { useToast } from '../components/Toast'

const EMPTY = { address: '', type: 'flat', bedrooms: 1, monthly_rent: '' }

export function Properties() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const load = () => {
    setLoading(true)
    api.get('/properties')
      .then((r) => setRows(r.data))
      .catch((e) => toast(errorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openNew = () => {
    setForm(EMPTY)
    setErrors({})
    setModal({ open: true, editing: null })
  }

  const openEdit = (row) => {
    setForm({
      address: row.address,
      type: row.type || 'flat',
      bedrooms: row.bedrooms ?? 1,
      monthly_rent: row.monthly_rent ?? '',
    })
    setErrors({})
    setModal({ open: true, editing: row })
  }

  const validate = () => {
    const e = {}
    if (!form.address.trim()) e.address = 'Address is required'
    if (form.monthly_rent === '' || Number(form.monthly_rent) <= 0) {
      e.monthly_rent = 'Monthly rent must be a positive number'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = async () => {
    if (!validate()) return
    setSaving(true)
    const payload = {
      address: form.address,
      type: form.type,
      bedrooms: Number(form.bedrooms) || 0,
      monthly_rent: Number(form.monthly_rent),
    }
    try {
      if (modal.editing) {
        await api.put(`/properties/${modal.editing.id}`, payload)
      } else {
        await api.post('/properties', payload)
      }
      setModal({ open: false, editing: null })
      load()
    } catch (e) {
      toast(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row) => {
    if (!confirm(`Delete property "${row.address}"?`)) return
    try {
      await api.delete(`/properties/${row.id}`)
      load()
    } catch (e) {
      toast(errorMessage(e))
    }
  }

  const columns = [
    { key: 'address', label: 'Address' },
    { key: 'type', label: 'Type' },
    { key: 'bedrooms', label: 'Beds' },
    {
      key: 'monthly_rent',
      label: 'Rent',
      render: (r) => `£${Number(r.monthly_rent).toLocaleString()}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span
          className={`inline-block px-2 py-0.5 text-xs rounded ${
            r.status === 'occupied'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-emerald-100 text-emerald-800'
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
        <h1 className="text-2xl font-semibold">Properties</h1>
        <button
          onClick={openNew}
          className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          + New property
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          empty="No properties yet"
          rowActions={(row) => (
            <>
              <button
                onClick={() => openEdit(row)}
                className="text-slate-600 hover:text-blue-700 text-xs mr-3"
              >
                Edit
              </button>
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
        open={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? 'Edit property' : 'New property'}
        footer={
          <>
            <button
              onClick={() => setModal({ open: false, editing: null })}
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
        <FormField label="Address" error={errors.address}>
          <input
            className={inputCls}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </FormField>
        <FormField label="Type">
          <select
            className={inputCls}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="flat">Flat</option>
            <option value="house">House</option>
            <option value="studio">Studio</option>
          </select>
        </FormField>
        <FormField label="Bedrooms">
          <input
            className={inputCls}
            type="number"
            min="0"
            value={form.bedrooms}
            onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
          />
        </FormField>
        <FormField label="Monthly rent (£)" error={errors.monthly_rent}>
          <input
            className={inputCls}
            type="number"
            min="0"
            step="0.01"
            value={form.monthly_rent}
            onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })}
          />
        </FormField>
        {modal.editing && (
          <FormField label="Status">
            <select
              className={inputCls}
              value={form.status || modal.editing.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="available">available</option>
              <option value="occupied">occupied</option>
            </select>
          </FormField>
        )}
      </Modal>
    </div>
  )
}
