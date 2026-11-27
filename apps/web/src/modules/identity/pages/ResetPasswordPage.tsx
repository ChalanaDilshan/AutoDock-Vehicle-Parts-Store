import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { authApi } from '../api/identityApi.js';
import { Alert, Button, Input } from '../../../shared/components/index.js';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token.trim() || !newPassword || !confirmPassword) {
      setErrorMessage('Reset token and password confirmation are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ token: token.trim(), newPassword });
      setSuccessMessage('Your password has been updated. Redirecting to sign in...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Set a New Password
          </h1>
          <p className="text-sm text-slate-600">
            Choose a strong password for your AutoDock account
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-4">
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!initialToken && (
              <Input
                label="Reset Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste recovery token"
                required
              />
            )}
            <Input
              label="New Password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              leftIcon={<KeyRound className="w-4 h-4" />}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              leftIcon={<KeyRound className="w-4 h-4" />}
              required
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
            >
              Update Password
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-600">
          Remembered it?{' '}
          <Link to="/login" className="font-medium text-[#E11D30] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
