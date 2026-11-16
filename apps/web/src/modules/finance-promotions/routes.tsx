import React from 'react';
import { RouteObject } from 'react-router-dom';

/**
 * MOD-04 Finance & Promotion Management (Frontend Routes Placeholder)
 */
const SellerInvoicesPage: React.FC = () => (
  <div className="bg-white p-6 rounded-lg border border-slate-200">
    <h1 className="text-xl font-bold text-slate-900 mb-2">Monthly Commission Invoices</h1>
    <p className="text-sm text-slate-600 mb-4">MOD-04 Finance Foundation</p>
    <div className="p-3 bg-blue-50 text-blue-800 rounded text-xs">
      Commission invoice overview & bank slip upload placeholder. Will be implemented in Module 04.
    </div>
  </div>
);

export const financePromotionsRoutes: RouteObject[] = [
  { path: 'seller/invoices', element: <SellerInvoicesPage /> },
];
