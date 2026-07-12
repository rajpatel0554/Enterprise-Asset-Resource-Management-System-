import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Assets from './components/Assets/Assets';
import AssetDetail from './components/Assets/AssetDetail';
import Allocations from './components/Allocations/Allocations';
import Bookings from './components/Bookings/Bookings';
import Maintenance from './components/Maintenance/Maintenance';
import Audits from './components/Audits/Audits';
import OrgSetup from './components/OrgSetup/OrgSetup';
import Reports from './components/Reports/Reports';

import { ToastProvider } from './contexts/ToastContext';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
      <Routes>
        {/* Auth Route */}
        <Route path="/login" element={<Login />} />

        {/* Authenticated Layout Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="assets" element={<Assets />} />
          <Route path="assets/:id" element={<AssetDetail />} />
          <Route path="allocations" element={<Allocations />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="audits" element={<Audits />} />
          <Route path="setup" element={<OrgSetup />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  );
}
