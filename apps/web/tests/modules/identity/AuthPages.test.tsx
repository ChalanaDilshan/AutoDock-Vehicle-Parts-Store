// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from '../../../src/modules/identity/pages/LoginPage.js';
import { RegisterPage } from '../../../src/modules/identity/pages/RegisterPage.js';
import { ProfilePage } from '../../../src/modules/identity/pages/ProfilePage.js';
import { ProtectedRoute } from '../../../src/modules/identity/components/ProtectedRoute.js';
import { CartLoginPrompt } from '../../../src/modules/identity/components/CartLoginPrompt.js';
import { AuthProvider } from '../../../src/modules/identity/context/AuthContext.js';
import { authApi } from '../../../src/modules/identity/api/identityApi.js';
import { getSafeRedirectPath } from '../../../src/modules/identity/utils/navigation.js';

// Mock authApi
vi.mock('../../../src/modules/identity/api/identityApi.js', () => {
  return {
    authApi: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      getMe: vi.fn(),
      updateMe: vi.fn(),
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

  it('CartLoginPrompt validates fields, toggles password visibility, and calls login on submit', async () => {
    vi.mocked(authApi.login).mockRejectedValueOnce({
      message: 'Invalid email or password credentials.',
      status: 401,
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <CartLoginPrompt />
        </AuthProvider>
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /^LOGIN$/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Please enter both your email address and password\./i)).toBeDefined();
    expect(authApi.login).not.toHaveBeenCalled();

    const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/^Password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByRole('button', { name: /Show password/i });
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');
    expect(screen.getByRole('button', { name: /Hide password/i })).toBeDefined();

    fireEvent.change(emailInput, { target: { value: 'customer@autodock.lk' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPass123!' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Invalid email or password credentials\./i)).toBeDefined();
    expect(emailInput.value).toBe('customer@autodock.lk');
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'customer@autodock.lk',
      password: 'WrongPass123!',
    });
  });

  it('LoginPage honors safe ?next=/sellers/register and blocks unsafe open redirects', async () => {
    expect(getSafeRedirectPath('/sellers/register')).toBe('/sellers/register');
    expect(getSafeRedirectPath('//evil.example/steal')).toBe('/');
    expect(getSafeRedirectPath('https://evil.example/steal')).toBe('/');

    vi.mocked(authApi.login).mockResolvedValueOnce({
      success: true,
      data: {
        accessToken: 'token_abc',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
        user: {
          id: 'u1',
          email: 'buyer@autodock.lk',
          firstName: 'Nimal',
          lastName: 'Perera',
          role: 'CUSTOMER',
          sellerId: null,
        },
      },
    });
    vi.mocked(authApi.getMe).mockResolvedValueOnce({
      success: true,
      data: {
        id: 'u1',
        email: 'buyer@autodock.lk',
        firstName: 'Nimal',
        lastName: 'Perera',
        phone: '+94771234567',
        role: 'CUSTOMER',
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
        sellerId: null,
      },
    });

    render(
      <MemoryRouter initialEntries={['/login?next=/sellers/register']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sellers/register" element={<div>Step 1 Store Registration</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    const createAccountLink = screen.getByRole('link', { name: /Create an account/i });
    expect(createAccountLink.getAttribute('href')).toBe('/register?next=%2Fsellers%2Fregister');

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'buyer@autodock.lk' },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: 'Pass1234!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(await screen.findByText('Step 1 Store Registration')).toBeDefined();
  });

  it('RegisterPage preserves safe ?next=/sellers/register when redirecting to login', async () => {
    vi.mocked(authApi.register).mockResolvedValueOnce({
      success: true,
      data: {
        userId: 'u2',
        email: 'new@autodock.lk',
        role: 'CUSTOMER',
        isEmailVerified: false,
      },
    });

    render(
      <MemoryRouter initialEntries={['/register?next=/sellers/register']}>
        <AuthProvider>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    const signInLink = screen.getByRole('link', { name: /Sign in/i });
    expect(signInLink.getAttribute('href')).toBe('/login?next=%2Fsellers%2Fregister');

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Kasun' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Silva' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'new@autodock.lk' } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '+94771234567' } });
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByRole('heading', { name: /Sign in to AutoDock/i })).toBeDefined();
  });

  it('ProfilePage displays Register as a Merchant CTA for CUSTOMER without sellerId', async () => {
    sessionStorage.setItem('accessToken', 'token_cust');
    vi.mocked(authApi.getMe).mockResolvedValueOnce({
      success: true,
      data: {
        id: 'u3',
        email: 'cust@autodock.lk',
        firstName: 'Amal',
        lastName: 'Fernando',
        phone: '+94771234567',
        role: 'CUSTOMER',
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
        sellerId: null,
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Register as a Merchant/i)).toBeDefined();
    const registerStoreLink = screen.getByRole('link', { name: /Register Store/i });
    expect(registerStoreLink.getAttribute('href')).toBe('/sellers/register');
  });
});
