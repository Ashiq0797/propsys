export function DataTable({ columns, rows, empty = 'No records', rowActions }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="text-slate-500 text-sm py-8 text-center border border-dashed border-slate-300 rounded">
        {empty}
      </div>
    )
  }
  return (
    <div className="overflow-x-auto bg-white border border-slate-200 rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="text-left px-3 py-2 font-medium">{c.label}</th>
            ))}
            {rowActions && <th className="px-3 py-2" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2">
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
              {rowActions && <td className="px-3 py-2 text-right whitespace-nowrap">{rowActions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
