// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from '../../../src/modules/identity/pages/LoginPage.js';
import { RegisterPage } from '../../../src/modules/identity/pages/RegisterPage.js';
import { ProtectedRoute } from '../../../src/modules/identity/components/ProtectedRoute.js';
import { AuthProvider, useAuth } from '../../../src/modules/identity/context/AuthContext.js';
import { authApi } from '../../../src/modules/identity/api/identityApi.js';

// Mock authApi
vi.mock('../../../src/modules/identity/api/identityApi.js', () => {
  return {
    authApi: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      getMe: vi.fn(),
    },
  };
});

describe('MOD-01 Authentication UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('Renders login page and validates empty submission', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Sign in to AutoDock/i })).toBeDefined();

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.getByText(/Please enter both your email address and password/i)).toBeDefined();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('Displays accessible error alert on invalid credentials', async () => {
    vi.mocked(authApi.login).mockRejectedValueOnce({
      message: 'Invalid email or password credentials.',
      status: 401,
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPass123!' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.getByText(/Invalid email or password credentials/i)).toBeDefined();
  });

  it('Renders customer register form with password mismatch validation and NO admin role option', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Create Customer Account/i })).toBeDefined();

    // Verify security requirement: No role selection allowed
    expect(screen.queryByLabelText(/role/i)).toBeNull();
    expect(screen.queryByText(/administrator/i)).toBeNull();

    // Try submit empty
    const submitBtn = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.getByText(/Please fill in all required registration fields/i)).toBeDefined();

    // Fill with password mismatch
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Sunil' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Silva' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'sunil@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '+94771234567' } });
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'Password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'DifferentPassword123' } });

    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Passwords do not match/i)).toBeDefined();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('ProtectedRoute redirects unauthenticated visitors to login', () => {
    render(
      <MemoryRouter initialEntries={['/account/profile']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Screen Destination</div>} />
            <Route
              path="/account/profile"
              element={
                <ProtectedRoute>
                  <div>Secret Profile Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Screen Destination')).toBeDefined();
    expect(screen.queryByText('Secret Profile Content')).toBeNull();
  });
});
