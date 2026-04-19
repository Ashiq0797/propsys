import { useEffect, useState } from 'react'
import { api, errorMessage, CURRENT_TENANT_ID } from '../api/client'
import { DataTable } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { FormField, inputCls } from '../components/FormField'
import { useToast } from '../components/Toast'

export function Maintenance() {
  const [rows, setRows] = useState([])
  const [me, setMe] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [issue, setIssue] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams({ tenant_id: String(CURRENT_TENANT_ID) })
    if (statusFilter) params.set('status', statusFilter)
    Promise.all([
      api.get(`/maintenance?${params.toString()}`),
      api.get(`/me?tenant_id=${CURRENT_TENANT_ID}`),
    ])
      .then(([m, u]) => {
        setRows(m.data)
        setMe(u.data)
      })
      .catch((e) => toast(errorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [statusFilter])

  const propertyId = me?.lease?.property?.id
  const propertyAddress = me?.lease?.property?.address

  const openNew = () => {
    setIssue('')
    setError('')
    setModalOpen(true)
  }

  const save = async () => {
    if (!issue.trim()) {
      setError('Describe the issue')
      return
    }
    if (!propertyId) {
      toast('No active lease — cannot file a request')
      return
    }
    setSaving(true)
    try {
      await api.post('/maintenance', {
        property_id: propertyId,
        issue,
      })
      setModalOpen(false)
      load()
    } catch (e) {
      toast(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'id', label: '#', render: (r) => `#${r.id}` },
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
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold">My Maintenance</h1>
        <div className="flex items-center gap-3">
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
            disabled={!propertyId}
            className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            + Report issue
          </button>
        </div>
      </div>
      {propertyAddress && (
        <p className="text-slate-500 text-sm mb-6">For {propertyAddress}</p>
      )}

      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          empty="No maintenance requests"
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Report a maintenance issue"
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
              {saving ? 'Sending…' : 'Send'}
            </button>
          </>
        }
      >
        {propertyAddress && (
          <p className="text-sm text-slate-500 mb-3">Property: {propertyAddress}</p>
        )}
        <FormField label="What's the issue?" error={error}>
          <textarea
            className={inputCls + ' h-28'}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            placeholder="e.g. boiler not heating water"
          />
        </FormField>
      </Modal>
    </div>
  )
}
