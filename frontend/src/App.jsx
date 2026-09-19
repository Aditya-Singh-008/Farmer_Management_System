import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Crops from './pages/Crops'
import Fields from './pages/Fields'
import Inventory from './pages/Inventory'
import Marketplace from './pages/Marketplace'
import Reports from './pages/Reports'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Public landing */}
          <Route path="/" element={<Landing />} />

          {/* Protected — all inside AppLayout */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard"   element={<Dashboard />} />
            <Route path="/crops"       element={<Crops />} />
            <Route path="/fields"      element={<Fields />} />
            <Route path="/inventory"   element={<Inventory />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/reports"     element={<Reports />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
