import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/identityApi.js';
import { KeyRound, Mail, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      setIsSubmitted(true);
    } catch (err: any) {
      // For security, even on non-existent email, we display generic acknowledgement or safe message
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Forgot Password</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter your email to receive a password reset token
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-900">Reset Request Processed</h3>
            <p className="text-xs text-emerald-700">
              If an account with that email exists, password reset instructions have been dispatched.
            </p>
            <div className="pt-2">
              <Link
                to="/reset-password"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
              >
                Have a reset token? Click here to reset password
              </Link>
            </div>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Send Reset Instructions</span>
                )}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
