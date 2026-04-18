import { useEffect, useState } from 'react'
import { api, errorMessage } from '../api/client'
import { DataTable } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { FormField, inputCls } from '../components/FormField'
import { useToast } from '../components/Toast'

const EMPTY = { name: '', email: '', phone: '' }

export function Tenants() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const load = () => {
    setLoading(true)
    api.get('/tenants')
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
    setForm({ name: row.name, email: row.email, phone: row.phone || '' })
    setErrors({})
    setModal({ open: true, editing: row })
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (modal.editing) {
        await api.put(`/tenants/${modal.editing.id}`, form)
      } else {
        await api.post('/tenants', form)
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
    if (!confirm(`Delete tenant "${row.name}"?`)) return
    try {
      await api.delete(`/tenants/${row.id}`)
      load()
    } catch (e) {
      toast(errorMessage(e))
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Tenants</h1>
        <button
          onClick={openNew}
          className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          + New tenant
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          empty="No tenants yet"
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
        title={modal.editing ? 'Edit tenant' : 'New tenant'}
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
        <FormField label="Name" error={errors.name}>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </FormField>
        <FormField label="Email" error={errors.email}>
          <input
            className={inputCls}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </FormField>
        <FormField label="Phone">
          <input
            className={inputCls}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </FormField>
      </Modal>
    </div>
  )
}
