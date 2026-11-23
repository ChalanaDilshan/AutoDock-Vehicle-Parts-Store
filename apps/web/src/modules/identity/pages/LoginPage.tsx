import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Lock, Mail, AlertCircle, Loader2, ArrowRight, ShieldCheck, CheckCircle2, Car } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email, password });
      
      // Navigate to return path or role default
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-6 sm:my-10">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Visual Column: Automotive Trust & Lifestyle */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#070b13] via-[#0d1424] to-[#0a192f] p-8 text-white flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-800">
          <div className="absolute top-0 right-0 w-60 h-60 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                <Car className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black tracking-tight">
                AUTO<span className="text-blue-500">DOCK</span>
                <span className="text-amber-500">.</span>
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-blue-400 bg-blue-950/80 border border-blue-800 px-2.5 py-1 rounded-full">
                Unified Portal
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                Precision Parts for Sri Lankan Vehicles
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect seamlessly as a vehicle owner, registered merchant, or platform admin.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-8 space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Chassis-Locked Virtual Garage</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Direct Bank Deposit & Verified Receipts</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span>256-Bit SSL Secured Session</span>
            </div>
          </div>
        </div>

        {/* Right Interactive Form Column */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 mb-3.5 shadow-xs">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sign in to AutoDock</h1>
            <p className="text-xs text-slate-500 mt-1">
              Access your customer orders, merchant storefront, or administrative workstation
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 shadow-2xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-bold text-slate-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-blue-600/25 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <p>
              New customer?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-800 font-bold">
                Create an account
              </Link>
            </p>
            <p>
              Want to sell spare parts?{' '}
              <Link
                to="/sellers/register"
                className="text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1"
              >
                <span>Apply as Merchant</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
