import React from 'react';
import { RouteObject } from 'react-router-dom';

/**
 * MOD-05 Administration, Notifications & Reporting (Frontend Routes Placeholder)
 */
const AdminDashboardPage: React.FC = () => (
  <div className="bg-white p-6 rounded-lg border border-slate-200">
    <h1 className="text-xl font-bold text-slate-900 mb-2">Administrative Workstation</h1>
    <p className="text-sm text-slate-600 mb-4">MOD-05 Platform Foundation</p>
    <div className="p-3 bg-purple-50 text-purple-800 rounded text-xs">
      Central administrator overview dashboard placeholder. Will be implemented in Module 05.
    </div>
  </div>
);

export const adminPlatformRoutes: RouteObject[] = [
  { path: 'admin/dashboard', element: <AdminDashboardPage /> },
];
