import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Alert, Button, Input } from '../../../shared/components/index.js';

/**
 * Inline sign-in card rendered on the Shopping Cart route when the visitor is not authenticated.
 * Mirrors the two-column header + centered card layout matched to AutoDock's slate/blue theme.
 */
export const CartLoginPrompt: React.FC = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setEmailError(undefined);
    setPasswordError(undefined);

    const trimmedEmail = email.trim();
    let hasValidationError = false;

    if (!trimmedEmail) {
      setEmailError('Please enter your email address.');
      hasValidationError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      hasValidationError = true;
    }

    if (!password) {
      setPasswordError('Please enter your password.');
      hasValidationError = true;
    }

    if (hasValidationError) {
      setFormError('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: trimmedEmail, password });
    } catch (err: any) {
      setFormError(err?.message || 'Invalid email or password credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Top Greeting & Registration Switcher Row */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-5">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
          Welcome to AutoDock! Please sign in.
        </h1>
        <p className="text-sm text-slate-600 shrink-0">
          New member?{' '}
          <Link
            to="/register"
            className="font-medium text-blue-700 hover:text-blue-800 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Register
          </Link>{' '}
          here.
        </p>
      </div>

      {/* Centered Card Surface */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs px-5 py-7 sm:px-10 sm:py-10">
        <div className="max-w-md mx-auto space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              Login with Password
            </h2>
            <p className="text-xs text-slate-600">
              Sign in to view your saved cart items and proceed to LKR checkout.
            </p>
          </div>

          {formError && <Alert variant="danger">{formError}</Alert>}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              id="cart-login-email"
              label="Email Address"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(undefined);
              }}
              placeholder="Please enter your email address"
              leftIcon={<Mail className="w-4 h-4" aria-hidden="true" />}
              error={emailError}
              required
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="cart-login-password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password{' '}
                  <span className="text-rose-600" aria-hidden="true">
                    *
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  Forgot Password?
                </Link>
              </div>
              <Input
                id="cart-login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(undefined);
                }}
                placeholder="Please enter your password"
                leftIcon={<Lock className="w-4 h-4" aria-hidden="true" />}
                className="pr-11"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="inline-flex items-center justify-center w-8 h-8 rounded text-slate-500 hover:text-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    {showPassword ? (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                }
                error={passwordError}
                required
              />
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                className="min-h-[44px] font-semibold tracking-wide"
              >
                LOGIN
              </Button>
            </div>
          </form>

          {/* Divider & Real Alternative Actions */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Create Account
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Browse Parts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
