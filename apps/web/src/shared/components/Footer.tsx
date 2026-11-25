import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Truck, Building2, CreditCard } from 'lucide-react';

/**
 * Shared application Footer with category links, customer services,
 * merchant support, copyright notice, and supported payment methods.
 */
export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-auto pt-10 pb-8 text-xs">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1: Brand */}
          <div className="space-y-3 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white">
                <Wrench className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">AutoDock</span>
            </div>
            <p className="text-xs text-slate-400">
              Genuine automotive spare parts with guaranteed vehicle fitment.
            </p>
          </div>

          {/* Column 2: Catalog & Categories */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Categories
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <Link to="/products?category=engine-and-drivetrain" className="hover:text-white transition">
                  Engine & Drivetrain
                </Link>
              </li>
              <li>
                <Link to="/products?category=brakes-and-suspension" className="hover:text-white transition">
                  Brakes & Suspension
                </Link>
              </li>
              <li>
                <Link to="/products?category=filters-and-fluids" className="hover:text-white transition">
                  Filters & Fluids
                </Link>
              </li>
              <li>
                <Link to="/products?category=electrical-and-lighting" className="hover:text-white transition">
                  Electrical & Lights
                </Link>
              </li>
              <li>
                <Link to="/products?category=transmission" className="hover:text-white transition">
                  Transmission
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Services */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Customer Services
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <Link to="/garage" className="hover:text-white transition">
                  My Garage
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition">
                  Track Orders
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Merchants & Support */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Merchants & Support
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <Link to="/sellers/register" className="hover:text-white text-blue-400 font-medium transition">
                  Sell on AutoDock
                </Link>
              </li>
              <li>
                <a href="tel:+94112345678" className="hover:text-white transition">
                  Hotline: +94 11 234 5678
                </a>
              </li>
              <li className="text-slate-500 pt-1">
                Island-wide delivery across all 25 districts
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment Badges */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            AutoDock — Sri Lanka Vehicle Spare-Parts Marketplace &copy; {new Date().getFullYear()}
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <span>Cash on Delivery</span>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bank Deposit</span>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span>Cards</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
