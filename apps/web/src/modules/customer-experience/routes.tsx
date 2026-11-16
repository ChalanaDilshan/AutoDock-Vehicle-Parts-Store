import React from 'react';
import { RouteObject } from 'react-router-dom';

/**
 * MOD-02 Product & Customer Experience (Frontend Routes Placeholder)
 */
const HomePage: React.FC = () => (
  <div className="py-8 text-center">
    <div className="inline-block p-2 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
      AutoDock Shared Foundation Active
    </div>
    <h1 className="text-3xl font-bold text-slate-900 mb-3">Sri Lanka Vehicle Spare-Parts Marketplace</h1>
    <p className="text-slate-600 max-w-xl mx-auto mb-6 text-sm">
      Find genuine OEM and aftermarket replacement parts verified for your exact vehicle make, model, and year.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
      <div className="p-4 bg-white rounded-lg border border-slate-200">
        <h3 className="font-semibold text-slate-900 text-sm mb-1">✔ Verified Compatibility</h3>
        <p className="text-xs text-slate-500">Search by Toyota, Honda, Nissan, Suzuki vehicle fitments.</p>
      </div>
      <div className="p-4 bg-white rounded-lg border border-slate-200">
        <h3 className="font-semibold text-slate-900 text-sm mb-1">🏪 Vetted Local Merchants</h3>
        <p className="text-xs text-slate-500">Physical store & online spare-parts sellers across 25 districts.</p>
      </div>
      <div className="p-4 bg-white rounded-lg border border-slate-200">
        <h3 className="font-semibold text-slate-900 text-sm mb-1">📦 Transparent Multi-Seller</h3>
        <p className="text-xs text-slate-500">Combined checkout with independent seller delivery tracking.</p>
      </div>
    </div>
  </div>
);

const ProductsPage: React.FC = () => (
  <div className="bg-white p-6 rounded-lg border border-slate-200">
    <h1 className="text-xl font-bold text-slate-900 mb-2">Parts Catalog</h1>
    <p className="text-sm text-slate-600 mb-4">MOD-02 Customer Experience Module Foundation</p>
    <div className="p-3 bg-blue-50 text-blue-800 rounded text-xs">
      Catalog and vehicle search interface placeholder. Full catalog will be implemented in Module 02.
    </div>
  </div>
);

const GaragePage: React.FC = () => (
  <div className="bg-white p-6 rounded-lg border border-slate-200">
    <h1 className="text-xl font-bold text-slate-900 mb-2">My Garage</h1>
    <p className="text-sm text-slate-600 mb-4">MOD-02 Saved Vehicles Foundation</p>
    <div className="p-3 bg-amber-50 text-amber-800 rounded text-xs">
      Customer garage interface placeholder. Will be implemented in Module 02.
    </div>
  </div>
);

export const customerExperienceRoutes: RouteObject[] = [
  { index: true, element: <HomePage /> },
  { path: 'products', element: <ProductsPage /> },
  { path: 'garage', element: <GaragePage /> },
];
