import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Summary */}
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-900">
              <span className="w-7 h-7 rounded-md bg-[#E11D30] text-white flex items-center justify-center">
                <Wrench className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="text-base font-bold tracking-tight">AutoDock</span>
            </Link>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
              Sri Lanka&apos;s multi-vendor vehicle spare-parts marketplace connecting drivers with verified garages and parts dealers.
            </p>
            <p className="text-xs text-slate-500">
              All transactions settled in LKR
            </p>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Popular Categories</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/products?category=engine-parts" className="hover:text-[#E11D30] transition-colors">
                  Engine Parts
                </Link>
              </li>
              <li>
                <Link to="/products?category=brake-system" className="hover:text-[#E11D30] transition-colors">
                  Brake System
                </Link>
              </li>
              <li>
                <Link to="/products?category=suspension-steering" className="hover:text-[#E11D30] transition-colors">
                  Suspension &amp; Steering
                </Link>
              </li>
              <li>
                <Link to="/products?category=filters-fluids" className="hover:text-[#E11D30] transition-colors">
                  Filters &amp; Fluids
                </Link>
              </li>
              <li>
                <Link to="/products?category=electrical-ignition" className="hover:text-[#E11D30] transition-colors">
                  Electrical &amp; Ignition
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/orders" className="hover:text-[#E11D30] transition-colors">
                  Track Orders
                </Link>
              </li>
              <li>
                <Link to="/garage" className="hover:text-[#E11D30] transition-colors">
                  My Garage
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-[#E11D30] transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-[#E11D30] transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Sellers & Payments */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Sellers &amp; Payments</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/seller/register" className="hover:text-[#E11D30] transition-colors">
                  Sell on AutoDock
                </Link>
              </li>
              <li>
                <Link to="/seller/dashboard" className="hover:text-[#E11D30] transition-colors">
                  Merchant Center
                </Link>
              </li>
            </ul>
            <div className="pt-2">
              <p className="text-xs font-medium text-slate-500 mb-2">Accepted Payment Methods</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded">
                  Cash on Delivery
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded">
                  Bank Deposit
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded">
                  Cards
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} AutoDock Marketplace. All rights reserved.</p>
          <p>Island-wide courier delivery across Sri Lanka</p>
        </div>
      </div>
    </footer>
  );
};
