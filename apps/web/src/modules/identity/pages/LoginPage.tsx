import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Alert, Button, Input } from '../../../shared/components/index.js';
import {
  buildAuthPathWithNext,
  getSafeRedirectTarget,
  RedirectLocationState,
} from '../utils/navigation.js';

function getLoginRedirectNotice(redirectTarget: string): string | null {
  if (!redirectTarget || redirectTarget === '/') {
    return null;
  }
  if (redirectTarget.startsWith('/garage')) {
    return 'Sign in to continue to My Garage';
  }
  if (redirectTarget.startsWith('/wishlist')) {
    return 'Sign in to view your Saved Wishlist';
  }
  if (redirectTarget.startsWith('/orders')) {
    return 'Sign in to view your Orders';
  }
  if (redirectTarget.startsWith('/checkout')) {
    return 'Sign in to continue to Checkout';
  }
  if (redirectTarget.startsWith('/account')) {
    return 'Sign in to access your Account Profile';
  }
  if (redirectTarget.startsWith('/seller')) {
    return 'Sign in to continue to Seller Portal';
  }
  if (redirectTarget.startsWith('/admin')) {
    return 'Sign in to continue to Admin Console';
  }
  return 'Sign in to continue';
}

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const stateFrom = (location.state as { from?: RedirectLocationState } | null)?.from;
  const redirectTarget = getSafeRedirectTarget(searchParams.get('next'), stateFrom, '/');
  const nextForAuthLinks = redirectTarget !== '/' ? redirectTarget : '';
  const redirectNotice = getLoginRedirectNotice(redirectTarget);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid email or password credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Sign in to AutoDock
          </h1>
          <p className="text-sm text-slate-600">
            Access your garage, orders, or merchant workspace
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-5">
          {redirectNotice && <Alert variant="info">{redirectNotice}</Alert>}
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password <span className="text-rose-600">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#E11D30] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link
            to={buildAuthPathWithNext('/register', nextForAuthLinks)}
            className="font-medium text-[#E11D30] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
