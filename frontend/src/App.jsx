import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import { Dashboard } from './pages/Dashboard'
import { Properties } from './pages/Properties'
import { Tenants } from './pages/Tenants'
import { Leases } from './pages/Leases'
import { Payments } from './pages/Payments'
import { Maintenance } from './pages/Maintenance'

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="properties" element={<Properties />} />
              <Route path="tenants" element={<Tenants />} />
              <Route path="leases" element={<Leases />} />
              <Route path="payments" element={<Payments />} />
              <Route path="maintenance" element={<Maintenance />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  )
}
