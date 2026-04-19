import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import { Dashboard } from './pages/Dashboard'
import { MyLease } from './pages/MyLease'
import { MyRent } from './pages/MyRent'
import { Maintenance } from './pages/Maintenance'

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="lease" element={<MyLease />} />
              <Route path="rent" element={<MyRent />} />
              <Route path="maintenance" element={<Maintenance />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  )
}
