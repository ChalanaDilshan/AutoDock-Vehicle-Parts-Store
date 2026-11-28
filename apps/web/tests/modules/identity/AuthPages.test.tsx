// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LoginPage } from '../../../src/modules/identity/pages/LoginPage.js';
import { RegisterPage } from '../../../src/modules/identity/pages/RegisterPage.js';
import { ProfilePage } from '../../../src/modules/identity/pages/ProfilePage.js';
import { ProtectedRoute } from '../../../src/modules/identity/components/ProtectedRoute.js';
import { CartLoginPrompt } from '../../../src/modules/identity/components/CartLoginPrompt.js';
import { AuthProvider } from '../../../src/modules/identity/context/AuthContext.js';
import { authApi } from '../../../src/modules/identity/api/identityApi.js';
import {
  getSafeRedirectPath,
  getSafeRedirectTarget,
} from '../../../src/modules/identity/utils/navigation.js';

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

  it('ProtectedRoute redirects /garage and /wishlist to /login with encoded ?next= param', () => {
    const LoginRouteCapture: React.FC = () => {
      const loc = useLocation();
      return (
        <div>
          <div data-testid="login-url">{`${loc.pathname}${loc.search}`}</div>
          <div data-testid="login-state-from">{(loc.state as any)?.from?.pathname || ''}</div>
        </div>
      );
    };

    const { unmount } = render(
      <MemoryRouter initialEntries={['/garage']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginRouteCapture />} />
            <Route
              path="/garage"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <div>My Garage Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('login-url').textContent).toBe('/login?next=%2Fgarage');
    expect(screen.getByTestId('login-state-from').textContent).toBe('/garage');
    unmount();

    render(
      <MemoryRouter initialEntries={['/wishlist']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginRouteCapture />} />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <div>Wishlist Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('login-url').textContent).toBe('/login?next=%2Fwishlist');
    expect(screen.getByTestId('login-state-from').textContent).toBe('/wishlist');
  });

  it('LoginPage shows contextual notice and navigates to /garage and /products?category=brake-pads when ?next= is present', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      success: true,
      data: {
        accessToken: 'token_cust',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
        user: {
          id: 'u1',
          email: 'customer@autodock.lk',
          firstName: 'Kasun',
          lastName: 'Perera',
          role: 'CUSTOMER',
          sellerId: null,
        },
      },
    });
    vi.mocked(authApi.getMe).mockResolvedValue({
      success: true,
      data: {
        id: 'u1',
        email: 'customer@autodock.lk',
        firstName: 'Kasun',
        lastName: 'Perera',
        phone: '+94771234567',
        role: 'CUSTOMER',
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
        sellerId: null,
      },
    });

    const DestinationCapture: React.FC<{ label: string }> = ({ label }) => {
      const loc = useLocation();
      return (
        <div>
          <span>{label}</span>
          <span data-testid="dest-url">{`${loc.pathname}${loc.search}`}</span>
        </div>
      );
    };

    const { unmount } = render(
      <MemoryRouter initialEntries={['/login?next=%2Fgarage']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/garage" element={<DestinationCapture label="My Garage Page" />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Sign in to continue to My Garage')).toBeDefined();
    expect(screen.getByRole('link', { name: /Create an account/i }).getAttribute('href')).toBe(
      '/register?next=%2Fgarage'
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'customer@autodock.lk' },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: 'CustomerPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(await screen.findByText('My Garage Page')).toBeDefined();
    expect(screen.getByTestId('dest-url').textContent).toBe('/garage');
    unmount();

    render(
      <MemoryRouter initialEntries={['/login?next=%2Fproducts%3Fcategory%3Dbrake-pads']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/products" element={<DestinationCapture label="Products Listing" />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Sign in to continue')).toBeDefined();
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'customer@autodock.lk' },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: 'CustomerPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(await screen.findByText('Products Listing')).toBeDefined();
    expect(screen.getByTestId('dest-url').textContent).toBe('/products?category=brake-pads');
  });

  it('LoginPage blocks unsafe open redirects and auth loops, falling back to /', async () => {
    expect(getSafeRedirectPath('/login')).toBe('/');
    expect(getSafeRedirectPath('/register?next=/garage')).toBe('/');
    expect(getSafeRedirectTarget('https://evil.com', { pathname: '/wishlist' })).toBe('/wishlist');
    expect(
      getSafeRedirectTarget(null, { pathname: '/products', search: '?category=engine-parts' })
    ).toBe('/products?category=engine-parts');

    vi.mocked(authApi.login).mockResolvedValue({
      success: true,
      data: {
        accessToken: 'token_cust',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
        user: {
          id: 'u1',
          email: 'customer@autodock.lk',
          firstName: 'Kasun',
          lastName: 'Perera',
          role: 'CUSTOMER',
          sellerId: null,
        },
      },
    });
    vi.mocked(authApi.getMe).mockResolvedValue({
      success: true,
      data: {
        id: 'u1',
        email: 'customer@autodock.lk',
        firstName: 'Kasun',
        lastName: 'Perera',
        phone: '+94771234567',
        role: 'CUSTOMER',
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
        sellerId: null,
      },
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={['/login?next=https%3A%2F%2Fevil.com']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>Storefront Home</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.queryByText(/Sign in to/i, { selector: 'div' })).toBeNull();
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'customer@autodock.lk' },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: 'CustomerPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(await screen.findByText('Storefront Home')).toBeDefined();
    unmount();

    render(
      <MemoryRouter initialEntries={['/login?next=%2F%2Fevil.com']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>Safe Home Fallback</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'customer@autodock.lk' },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: 'CustomerPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(await screen.findByText('Safe Home Fallback')).toBeDefined();
  });

  it('LoginPage and RegisterPage preserve ?next=%2Fwishlist across account creation', async () => {
    vi.mocked(authApi.register).mockResolvedValueOnce({
      success: true,
      data: {
        userId: 'u2',
        email: 'new@autodock.lk',
        role: 'CUSTOMER',
        isEmailVerified: false,
      },
    });

    const LoginCapture: React.FC = () => {
      const loc = useLocation();
      return (
        <div>
          <LoginPage />
          <div data-testid="post-register-url">{`${loc.pathname}${loc.search}`}</div>
        </div>
      );
    };

    render(
      <MemoryRouter initialEntries={['/register?next=%2Fwishlist']}>
        <AuthProvider>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginCapture />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Sign in/i }).getAttribute('href')).toBe(
      '/login?next=%2Fwishlist'
    );

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Kasun' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Silva' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'new@autodock.lk' } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '+94771234567' } });
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText('Sign in to view your Saved Wishlist')).toBeDefined();
    expect(screen.getByTestId('post-register-url').textContent).toBe('/login?next=%2Fwishlist');
  });
});
