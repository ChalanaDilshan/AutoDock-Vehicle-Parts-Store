import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../api/identityApi.js';
import { Button } from '../../../shared/components/index.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-sm text-slate-500">Verifying session...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div
        data-testid="auth-forbidden"
        className="max-w-lg mx-auto my-12 bg-white border border-slate-200 rounded-lg p-8 text-center space-y-4"
      >
        <div className="w-11 h-11 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-slate-900">
            Access Restricted (403)
          </h1>
          <p className="text-sm text-slate-600">
            Your current role (<span className="font-semibold text-slate-900">{user.role}</span>) does not have permission to view this page.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          <a href="/">
            <Button variant="outline" size="sm">
              Return Home
            </Button>
          </a>
        </div>
        <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Role-based access check</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
