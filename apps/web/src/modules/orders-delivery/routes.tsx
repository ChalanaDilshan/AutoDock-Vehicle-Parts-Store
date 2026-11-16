import React from 'react';
import { RouteObject } from 'react-router-dom';

/**
 * MOD-03 Orders, Payments & Delivery (Frontend Routes Placeholder)
 */
const CartPage: React.FC = () => (
  <div className="bg-white p-6 rounded-lg border border-slate-200 max-w-2xl mx-auto">
    <h1 className="text-xl font-bold text-slate-900 mb-2">Shopping Cart</h1>
    <p className="text-sm text-slate-600 mb-4">MOD-03 Orders Foundation</p>
    <div className="p-3 bg-blue-50 text-blue-800 rounded text-xs">
      Multi-seller cart interface placeholder. Will be implemented in Module 03.
    </div>
  </div>
);

const CheckoutPage: React.FC = () => (
  <div className="bg-white p-6 rounded-lg border border-slate-200 max-w-2xl mx-auto">
    <h1 className="text-xl font-bold text-slate-900 mb-2">Checkout</h1>
    <p className="text-sm text-slate-600 mb-4">MOD-03 Checkout & Delivery Foundation</p>
    <div className="p-3 bg-emerald-50 text-emerald-800 rounded text-xs">
      Multi-vendor address & delivery fee quote placeholder. Will be implemented in Module 03.
    </div>
  </div>
);

export const ordersDeliveryRoutes: RouteObject[] = [
  { path: 'cart', element: <CartPage /> },
  { path: 'checkout', element: <CheckoutPage /> },
];
