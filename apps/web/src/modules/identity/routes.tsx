import React from 'react';
import { RouteObject } from 'react-router-dom';

/**
 * MOD-01 Identity & Seller Verification (Frontend Routes Placeholder)
 * Full business pages will be implemented in subsequent module prompts.
 */
const LoginPage: React.FC = () => (
  <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm border border-slate-200">
    <h1 className="text-xl font-bold text-slate-900 mb-2">Customer / Seller Login</h1>
    <p className="text-sm text-slate-600 mb-4">MOD-01 Identity Module Foundation</p>
    <div className="p-3 bg-blue-50 text-blue-800 rounded text-xs">
      Authentication interface placeholder. Business form will be implemented in Module 01.
    </div>
  </div>
);

const SellerRegisterPage: React.FC = () => (
  <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm border border-slate-200">
    <h1 className="text-xl font-bold text-slate-900 mb-2">Seller Registration</h1>
    <p className="text-sm text-slate-600 mb-4">MOD-01 Seller Onboarding Foundation</p>
    <div className="p-3 bg-emerald-50 text-emerald-800 rounded text-xs">
      Seller registration form placeholder. Business form will be implemented in Module 01.
    </div>
  </div>
);

export const identityRoutes: RouteObject[] = [
  { path: 'login', element: <LoginPage /> },
  { path: 'sellers/register', element: <SellerRegisterPage /> },
];
